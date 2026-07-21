SFFS Creator Studio - sample shorts
===================================

Drop rendered .mp4 shorts in this folder to make them one-click postable from
the /tiktok page ("Or pick a sample"). Then list them in manifest.json:

  {
    "videos": [
      {
        "id": "fella-test-01",
        "title": "Fella Test teaser",
        "src": "/tiktok-samples/fella-test-01.mp4",
        "caption": "Smart Fella or Fart Smella? Take the test #fellatest"
      }
    ]
  }

Fields:
  id       - unique string
  title    - shown on the sample button
  src      - absolute site path to the file in this folder
  caption  - optional default caption

How samples post (and why they can be large):
  Samples are served from our own domain. When you post one, the browser sends
  only the URL to /api/tiktok/post, and the SERVER fetches the bytes and
  chunk-uploads them to TikTok. This side-steps Vercel's ~4.5MB limit on the
  request body sent to a serverless function, which DOES apply to the local
  "pick an .mp4 from your computer" path. So: use the file picker for small demo
  clips, and hosted samples for full-size rendered shorts.

These files are public (served at /tiktok-samples/<file>). Don't put anything
private here.
