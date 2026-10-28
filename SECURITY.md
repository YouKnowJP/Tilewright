# Security

Current main is the supported revision. Report vulnerabilities through
[private security reporting](https://github.com/YouKnowJP/Tilewright/security/advisories/new) when enabled.
If unavailable, open an issue requesting a private contact without exposing
secrets or exploit details. There is no guaranteed response time.

The game runs locally in the browser. Editable saves/scores are not trusted
competition records. The development server binds to 127.0.0.1 and serves an
explicit asset allowlist; it is not a general file server. Imported worlds and
backups are validated data, not executable scripts. Do not include real
credentials or personal data in reports, shared worlds, or test fixtures.
