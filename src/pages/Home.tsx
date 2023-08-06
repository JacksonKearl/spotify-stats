import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks"
import { FunctionComponent } from "preact"
import Plot from "react-plotly.js"

const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "long" })
const yearFormatter = new Intl.DateTimeFormat(undefined, { year: "numeric" })
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long" })
const hourFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric" })
const periodFormatter = (date: Date) => {
  const h = date.getHours()
  if (h >= 6 && h <= 13) {
    return ["early", 0]
  }
  if (h >= 13 && h <= 21) {
    return ["late", 1]
  }
  return ["night", 2]
}

const useQueryState = <T extends string>(
  name: string,
  start: T,
): [T, (v: T) => void] => {
  const url = new URL(window.location.href)
  const [internal, setInternal] = useState<T>(
    (url.searchParams.get(name) ?? start) as T,
  )

  const setAll = (v: T) => {
    const url = new URL(window.location.href)
    if (v && v !== start) {
      url.searchParams.set(name, v)
    } else {
      url.searchParams.delete(name)
    }
    window.history.replaceState(null, "null", url)
    setInternal(v)
  }

  return [internal, setAll]
}

import spotifyData from "../assets/spotify_clean.json"
import { synesthesia } from "./HashFinder"

type SpotifyRaw = {
  ts: string
  ms_played: number
  master_metadata_track_name: string
  master_metadata_album_artist_name: string
  master_metadata_album_album_name: string
  episode_name: string
  episode_show_name: string
}

type SpotifyClean = {
  name: string
  duration_played: number
  artist: string
  album: string
  play_date: string
  is_podcast: boolean
}

type ItemData = {
  songCount: number
  playCount: number
  playTime: number
  key: string
  secondary: string
}

type Field =
  | "name"
  | "artist"
  | "album"
  | "year"
  | "month"
  | "day"
  | "hour"
  | "period"

const App: FunctionComponent<{
  primary: Field
  breakout: Field
  width: number
  data: SpotifyClean[]
  minPlay: number
}> = ({ breakout, primary, data: rawData, minPlay }) => {
  const record: Record<string, ItemData> = {}
  const primarySortKey: Record<string, number> = {}
  const totalSortKey: Record<string, number> = {}
  const r = useRef<HTMLDivElement>(null)
  const [minHeight, setMinHeight] = useState(0)

  useLayoutEffect(() => {
    const height = r.current?.clientHeight ?? -Infinity
    setMinHeight(height)
  }, [primary, rawData])

  const labelFinder: Record<string, string> = {}

  for (const datum of rawData) {
    if (!datum.artist || !datum.name || !datum.album) {
      continue
    }
    if (datum.duration_played < 10000) {
      continue
    }

    datum.artist = datum.artist.replace(/Kanye West/, "Ye")
    datum.album = datum.album.replace(/\s*\(.*\)/, "")
    datum.album = datum.album.replace(/\s*\[.*\]/, "")
    datum.album = datum.album.replace(/:.*Box Set/, "")

    const playDate = new Date(datum.play_date)
    const labels = {
      year: yearFormatter.format(playDate),
      month: monthFormatter.format(playDate),
      day: dayFormatter.format(playDate),
      hour: hourFormatter.format(playDate),
      period: periodFormatter(playDate)[0],
    }

    const dates = {
      year: playDate.getFullYear(),
      month: playDate.getMonth(),
      day: playDate.getDay(),
      hour: playDate.getHours(),
      period: periodFormatter(playDate)[1],
    }

    const key = "" + { ...datum, ...dates }[primary]
    const secondary = "" + { ...datum, ...labels }[breakout]

    labelFinder[key] = (labels as any)[primary]

    if (!key || !secondary) continue

    const lookup = JSON.stringify({ key, secondary })
    record[lookup] = record[lookup] ?? {
      songCount: 0,
      playCount: 0,
      playTime: 0,
      key,
      secondary,
    }

    const playTime = datum.duration_played / 1000 / 60 / 60

    record[lookup].playTime += playTime
    primarySortKey[key] = (primarySortKey[key] ?? 0) + playTime
    totalSortKey[lookup] = (totalSortKey[lookup] ?? 0) + playTime
  }

  const sorted = Object.entries(record)
    .filter(([, d]) => d.playTime > minPlay)
    .sort(([, a], [, b]) => primarySortKey[b.key] - primarySortKey[a.key])

  const secondaryLabels = new Set<string>()
  const primaryLabels = new Set<string>()

  for (const item of sorted) {
    primaryLabels.add(item[1].key)
    secondaryLabels.add(item[1].secondary)
  }

  let labels: string[] = [...primaryLabels]

  const indexLookup: Record<string, number> = {}
  labels.forEach((l, i) => (indexLookup[l] = i))

  const labelQuantifier = (v: number) =>
    v > 1.5
      ? `${Math.round(v * 100) / 100} Hours Played`
      : `${Math.round(v * 60)} Minutes Played`

  const plotlyData = sorted
    .map(([id, data]) => ({
      secondaryOrder: totalSortKey[id],
      primaryOrder: primarySortKey[data.key],
      data: {
        type: "bar",
        x: [data.playTime],
        y: [data.key],
        text: data.secondary,
        textposition: "inside",
        marker: { color: [synesthesia("37mw5", data.secondary)] },
        orientation: "h",
        hovertext: `${data.secondary} | ${
          labelFinder[data.key] ?? data.key
        } | ${labelQuantifier(data.playTime)}`,
        hoverinfo: "text",
      } satisfies Plotly.Data,
    }))
    .sort(({ secondaryOrder: a }, { secondaryOrder: b }) => b - a)
    .sort(({ primaryOrder: a }, { primaryOrder: b }) => b - a)
    .map(({ data }) => data)
  const maxLabelLength = 20

  console.log({
    totalSortKey,
    primarySortKey,
    sorted,
    primaryLabels,
    secondaryLabels,
    labels,
  })

  const w = document.body.clientWidth
  const layout: Partial<Plotly.Layout> = {
    showlegend: false,
    barmode: "stack",

    margin: {
      l: 150,
      r: 20,
      b: 20,
      t: 20,
      pad: 4,
    },
    height: Math.max(labels.length * 20, minHeight),
    width: w,
    yaxis: {
      autorange: "reversed",
      ticktext: labels.map(
        (label) =>
          labelFinder[label] ??
          (label.length < maxLabelLength
            ? label
            : label.slice(0, maxLabelLength - 1) + "\u2026"),
      ),
      tickvals: labels,
    },
    xaxis: {
      side: "top",
      rangemode: "tozero",
      ticksuffix: " hours",
    },
  }

  // some bignum bullshit
  const UntypedPlot = Plot as any
  return (
    <div ref={r} style={`flex-grow: 1; min-height: ${labels.length * 20}px`}>
      <UntypedPlot
        data={plotlyData}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
      ></UntypedPlot>
    </div>
  )
}

export function Home() {
  const [uuid, setUUID] = useQueryState<string>("id", "")
  const [source, setSource] = useState(uuid ? "saved" : "default")
  const [data, setData] = useState<SpotifyClean[]>(uuid ? [] : [...spotifyData])

  useMemo(async () => {
    if (uuid) {
      const resp = await fetch("/store?id=" + uuid)
      if (!resp.ok) {
        alert("There was an error accessing saved data.")
      } else {
        setData(await resp.json())
        setSource("saved")
      }
    }
  }, [uuid])

  const [primary, setPrimary] = useQueryState<Field>("main", "artist")
  const [breakout, setBreakout] = useQueryState<Field>("break", "album")
  const [minPlay, setMinPlay] = useQueryState<string>("mindur", "1")
  const [windowStart, setWindowStart] = useQueryState<string>("start", "0")
  const [windowWidth, setWindowWidth] = useQueryState<string>("width", "1")
  const [musicPodFilter, setMusicPodFilter] = useQueryState<
    "both" | "music" | "pod"
  >("pod", "both")

  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/analytics" + new URL(window.location.href).search)
    }, 1000)
    return () => clearTimeout(t)
  }, [primary, breakout, minPlay, windowStart, windowWidth, musicPodFilter])

  const [width, setWidth] = useState(document.body.clientWidth)
  useEffect(() => {
    const handler = () => setWidth(document.body.clientWidth)
    window.addEventListener("resize", handler)

    return () => window.removeEventListener("resize", handler)
  })

  const makeSelector = (v: string, sV: (v: Field) => void) => (
    <select value={v} onChange={(e) => sV(e.currentTarget.value as Field)}>
      <option value="name">Title</option>
      <option value="artist">Artist</option>
      <option value="album">Album</option>
      <option value="year">Year</option>
      <option value="month">Month</option>
      <option value="day">Day</option>
      <option value="hour">Hour</option>
      <option value="period">Period</option>
    </select>
  )

  const musicVSPodcast = (
    <div style="display: flex; gap: 5px">
      Showing
      <label>
        <input
          type="radio"
          name="musicpod"
          checked={musicPodFilter === "music"}
          onClick={() => setMusicPodFilter("music")}
        ></input>
        Music
      </label>
      <label>
        <input
          type="radio"
          name="musicpod"
          checked={musicPodFilter === "pod"}
          onClick={() => setMusicPodFilter("pod")}
        ></input>
        PodCasts
      </label>
      <label>
        <input
          type="radio"
          name="musicpod"
          checked={musicPodFilter === "both"}
          onClick={() => setMusicPodFilter("both")}
        ></input>
        Both
      </label>
      <label style="display: content">
        played for over
        <input
          style="width: 45px; margin: 0 2px"
          type="number"
          value={minPlay}
          onChange={(e) => setMinPlay(e.currentTarget.value)}
        ></input>
        minute{minPlay === "1" ? "" : "s"}.
      </label>
    </div>
  )

  data.sort((a, b) => +new Date(a.play_date) - +new Date(b.play_date))
  const firstData = data[0]
  const lastData = data[data.length - 1]

  const durationInput = <></>

  const firstAsUNIXTime = +new Date(firstData.play_date)
  const lastAsUNIXTime = +new Date(lastData.play_date)
  const eraAsUnixTime = lastAsUNIXTime - firstAsUNIXTime

  const startAsUNIXTime = +windowStart * eraAsUnixTime + firstAsUNIXTime
  const widthAsUNIXTime = +windowWidth * eraAsUnixTime
  const endAsUNIXTime = startAsUNIXTime + widthAsUNIXTime

  const widthInDays = Math.round(widthAsUNIXTime / 1000 / 60 / 60 / 24)

  const ranges = (
    <div style="display: flex;">
      <div style="display: flex; flex-direction: column; flex-basis: 50%">
        From {new Date(startAsUNIXTime).toLocaleDateString()}
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={windowStart}
          onInput={(e) => setWindowStart("" + e.currentTarget.value)}
        ></input>
      </div>
      <div style="display: flex; flex-direction: column; flex-basis: 50%">
        <p>
          Until {new Date(endAsUNIXTime).toLocaleDateString()} ({widthInDays}{" "}
          days)
        </p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={windowWidth}
          onInput={(e) => setWindowWidth("" + e.currentTarget.value)}
        ></input>
      </div>
    </div>
  )

  const filteredData = data
    .map((v) => ({ ...v }))
    .filter((v) => {
      if (musicPodFilter === "pod" && !v.is_podcast) return false
      if (musicPodFilter === "music" && v.is_podcast) return false

      const unixTime = +new Date(v.play_date)
      if (unixTime < startAsUNIXTime || unixTime > endAsUNIXTime) return false

      return true
    })

  return (
    <>
      <p style={"padding: 5px"}>
        Grouped by {makeSelector(primary, setPrimary)}, broken out by{" "}
        {makeSelector(breakout, setBreakout)}.
        <br />
        {source === "clipboard" ? (
          <>
            Using data from clipboard.{" "}
            <button
              onClick={async () => {
                const resp = await fetch("/store", {
                  method: "POST",
                  body: JSON.stringify(data),
                })
                if (!resp.ok) {
                  alert("There was an error uploading your data.")
                  return
                }
                const uuid = await resp.text()
                setUUID(uuid)
              }}
            >
              Upload for shareable link
            </button>
          </>
        ) : source === "default" ? (
          "Using default data."
        ) : (
          "Using saved data."
        )}{" "}
        <div style="display: inline;">
          <label for="files" class="btn">
            Import your own Data (no upload, all data stays local)
          </label>{" "}
          <input
            id="files"
            type="file"
            onChange={async (e) => {
              console.log(e)
              const clean: SpotifyClean[] = []

              for (const file of e.currentTarget.files ?? []) {
                const data = await file.text()
                try {
                  const parsed = JSON.parse(data) as SpotifyRaw[]
                  for (const play of parsed) {
                    if (play.ms_played > 0) {
                      clean.push({
                        name:
                          play.master_metadata_track_name ?? play.episode_name,
                        duration_played: play.ms_played,
                        artist:
                          play.master_metadata_album_artist_name ??
                          play.episode_show_name,
                        album:
                          play.master_metadata_album_album_name ??
                          play.episode_show_name,
                        play_date: play.ts,
                        is_podcast: Boolean(play.master_metadata_track_name),
                      })
                    }
                  }
                } catch (e) {
                  alert(
                    "Error reading files. Ensure they are unzipped and in .json format.",
                  )
                }
              }
              if (clean.length) {
                console.log({ clean })
                setUUID("")
                setData(clean)
                setSource("clipboard")
              }
            }}
          ></input>
        </div>{" "}
        <div>
          <a href="/howto">How Do I Request My Data from Spotify?</a>
        </div>
        <div>
          {musicVSPodcast} {durationInput}
        </div>
        <div>{ranges}</div>
      </p>
      <App
        primary={primary}
        breakout={breakout}
        data={filteredData}
        width={width}
        minPlay={+minPlay / 60}
      ></App>
      <p style={"padding: 5px"}>
        This uses <a href="https://plotly.com/javascript/">plotly.js</a>, and{" "}
        <a href="https://preactjs.com/">preact</a>!{" "}
        <a href="https://github.com/JacksonKearl/spotify-stats">View Source</a>
        {" | "}
        <a href="/privacy">Privacy Policy</a>
        {" | "}
        <a href="https://apple-music-stats.pages.dev">Apple Music Version</a>
      </p>
    </>
  )
}
