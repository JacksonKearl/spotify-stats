import { FunctionComponent } from "preact"

export const HowTo: FunctionComponent = () => {
  return (
    <div
      style={
        "display: flex; flex-direction: column; max-width: 750px; margin: 0 auto; gap: 10px;"
      }
    >
      <h1>Hello!</h1>
      <p>
        So you'll start by going to Spotify's{" "}
        <a
          href="https://www.spotify.com/us/account/privacy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Settings
        </a>{" "}
        page, then scroll all the way to the bottom and select the "Extended
        streaming history" checkbox. Click "Request Data", then sit back and
        wait for about a week for the data to come. You should maybe bookmark
        this page so you can find it in a week. You can try sending yourself an
        email below but the Cloudflare mailchannels API it uses isn't really
        working.
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const r = await fetch("/sendEmail", {
            method: "POST",
            body: new FormData(e.currentTarget),
          })
          if (r.ok) {
            alert(
              "Sent! Move the email out of spam so your search finds it in a week, perhaps?",
            )
          } else {
            alert("Drat, there was an error.")
          }
        }}
      >
        <input name="email" type="email" required></input>
        <button type="submit">
          Send me an Email so I don't forget this website
        </button>
      </form>
      <p>
        <b>Note!</b> You'll get an email with your basic "Account Data" before
        you receive the full "Extended Streaming History" data. This data will
        include a year of history, but unfortunately not in a usable format. To
        use this site you'll need to wait for the full "Extended Streaming
        History" data.
      </p>
      <p>
        Once you get the "Your extended streaming history is ready to download"
        email, clicking the "DOWNLOAD" link should take you to a Spotify page
        where the download automatically starts. Once complete, unzip the file,
        locate the "Streaming_History_Audio_{"{"}...{"}"}-2023.json" document,
        and select it from the file picker on the home page. (You can select
        multiple files if needed.)
      </p>
    </div>
  )
}
