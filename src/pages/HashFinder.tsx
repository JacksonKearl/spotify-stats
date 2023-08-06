import { FunctionComponent } from "preact"
import { useState } from "preact/hooks"

export const synesthesia = (seed: string, text: string): string => {
  const hash = cyrb128(text + seed)[0]
  const r = (hash & 0xff0000) >> 16
  const g = (hash & 0x00ff00) >> 8
  const b = hash & 0x0000ff

  const color = `rgb(${r}, ${g}, ${b})`

  console.log({ color, fullText: text + seed, seed: text })
  return color
}

const seeds = [
  "vaf",
  "2phkl",
  "1lqvy",
  "5ku1p",
  "14wjd",
  "4r5mo",
  "noge",
  "4aw89",
  "388t9",
  "bf32",
  "u30f",
  "1w7b4",
  "1tsty",
  "4alhh",
  "37mw5",
  "3xi0z",
  "3bq80",
  "3p0r4",
  "205ir",
  "1bo6n",
  "jfgi",
  "27mrb",
  "3zxww",
  "12hon",
  "p6oo",
  "4azyl",
  "5v6it",
  "540to",
  "3sl20",
  "5wopp",
  "4u4yo",
  "3xtw0",
  "3rh5f",
  "6iw2",
  "5hgeq",
  "2rbpq",
  "2mdv1",
  "4jn1k",
  "1ylht",
  "50fvs",
  "5my7e",
  "34o4f",
  "3um9",
  "1jlvw",
  "5vre7",
  "52ezv",
  "3kjfe",
  "lb1b",
  "4cef1",
  "54zs0",
  "2gsin",
  "5veia",
  "1aguh",
  "yql8",
  "31uc3",
  "55s8d",
  "4gy2p",
  "49oec",
  "1o0xa",
  "4ibug",
  "1oymp",
  "1qmwr",
  "2o621",
  "1nq09",
  "1plq4",
  "3qhl1",
  "4l4ye",
  "3l1j0",
  "5t18m",
  "mkii",
  "2zjdz",
  "48ged",
  "rlhr",
  "h09h",
  "3ty11",
  "5jfjo",
  "50zya",
  "17l1x",
  "kdr6",
  "2moq9",
  "3mzex",
  "1gzx0",
  "5a1ik",
  "9af1",
  "3umnq",
  "49c03",
  "5cr6k",
  "3d9ni",
  "wg41",
  "19wk9",
  "5ryld",
  "1hgx7",
  "59i98",
  "584tn",
  "3l1g0",
  "5ur1f",
  "gau0",
  "5ibgo",
  "3xnxh",
  "3mn5m",
]

export const HashFinder: FunctionComponent = () => {
  const [seed, setSeed] = useState<number>(0)
  const incSeed = () => setSeed(seed + 1)

  const ColorCell: FunctionComponent<{
    name: string
  }> = (props) => {
    const backgroundColor = synesthesia(seeds[seed], props.name)
    return (
      <div style={{ backgroundColor, flexBasis: "100%" }}>{props.name}</div>
    )
  }

  return (
    <div
      style={{ display: "flex", width: "100vw", height: "100vh" }}
      onClick={() => {
        incSeed()
      }}
    >
      <ColorCell name="The Love Club EP"></ColorCell>
      <ColorCell name="Pure Heroine"></ColorCell>
      <ColorCell name="Melodrama"></ColorCell>
      <ColorCell name="Solar Power"></ColorCell>
    </div>
  )
}

const cyrb128 = (str: string) => {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)

  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ]
}
