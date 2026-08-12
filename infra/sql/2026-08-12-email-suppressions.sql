-- Unsubscribe suppression list.
--
-- ===========================================================================
-- WHY A SEPARATE TABLE AND NOT A COLUMN ON email_signups
-- ===========================================================================
-- A suppression has to OUTLIVE the list entry it refers to. Deleting somebody
-- from email_signups (which /privacy promises to do on request) would take a
-- flag-on-the-row with it, and the next time that address arrived through the
-- test it would come back as a fresh, mailable signup. The person said stop
-- once; they should not have to say it again because we tidied up.
--
-- Keeping it apart also means the answer to "may we mail this address" is one
-- lookup that does not care how many source rows the address has, which is the
-- shape the send path actually wants.
--
-- ===========================================================================
-- THE EMAIL IS THE KEY, LOWERCASED BY THE CALLER
-- ===========================================================================
-- Every writer in this system already lowercases and trims before it gets
-- here (the website route, the Lambda branch, and the token decoder all do).
-- The primary key makes a second unsubscribe a no-op rather than an error,
-- which is what lets the endpoint be safely hit twice by a mail scanner.
--
-- Apply with:
--   aws rds-data execute-statement \
--     --resource-arn "$CLUSTER_ARN" --secret-arn "$SECRET_ARN" \
--     --database sffs --sql "$(cat 2026-08-12-email-suppressions.sql)"

CREATE TABLE IF NOT EXISTS email_suppressions (
    email        text PRIMARY KEY,
    -- Why the address is suppressed. 'unsubscribe' is the person asking.
    -- 'bounce' and 'complaint' are reserved for provider feedback so a later
    -- webhook has somewhere to write without another migration.
    reason       text        NOT NULL DEFAULT 'unsubscribe',
    created_at   timestamptz NOT NULL DEFAULT now(),
    -- First-seen wins on the reason, but a repeat still touches this, so
    -- "they clicked it three times" stays visible without a second row.
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    hits         integer     NOT NULL DEFAULT 1,
    meta         jsonb       NOT NULL DEFAULT '{}'::jsonb
);

-- The send path asks "is this address suppressed" for a batch of addresses at
-- a time. The primary key already serves that, so there is deliberately no
-- second index here: one more index on a table this small costs more to
-- maintain than it saves.

COMMENT ON TABLE email_suppressions IS
    'Addresses that asked not to receive product email. Consulted before every '
    'product send. Survives deletion of the corresponding email_signups row.';
