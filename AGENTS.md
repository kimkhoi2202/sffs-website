<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Driving a browser at PostHog

If you are writing or running anything that automates a browser and then asserts
on PostHog events, read `docs/analytics/browser-automation-and-posthog.md`
first. Two traps there fail **silently and green** — posthog-js suppresses all
capture when `navigator.webdriver` is true, so the suite asserts over an empty
event list and passes; and route interception misses the batch a closing tab
flushes, so a run against production can put synthetic people into the funnel.
The second one has already happened once.
