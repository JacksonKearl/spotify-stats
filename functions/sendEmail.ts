export const sendEmail = async (options: {
  to: string
  body: string
  subject: string
}) =>
  fetch(
    new Request("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
          },
        ],
        from: {
          email: "noreply@spotifystats.pages.dev",
          name: "SpotifyStats",
        },
        subject: options.subject,
        content: [
          {
            type: "text/plain",
            value: options.body,
          },
        ],
      }),
    }),
  )

export const onRequestPost: PagesFunction = async ({ env, request }) => {
  const data = await request.formData()
  const email = data.get("email")
  if (!email) return new Response("Ew.", { status: 400 })

  await sendEmail({
    to: email,
    subject: "Click Here when Spotify gives you your data",
    body: "You got your spotify data? And not just the Account data, but the Extended Playback History? Great. Download it, unzip it, then go to https://spotifystats.pages.dev and select the file.\n\nNote: by default all data stays local to your browser, if you do choose to upload the data for sharing, all personal information will be stripped before upload.",
  })
  return new Response("k")
}
