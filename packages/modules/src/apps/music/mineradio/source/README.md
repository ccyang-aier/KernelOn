# Mineradio canonical source snapshot

This directory is the KernelOn-owned canonical source snapshot for the Mineradio app port.
It is pinned to upstream commit `6b130103f759e5dcd1e133700071c8216b8fa5a6` and every
imported file is verified by SHA-256 in `scripts/mineradio/sync-source.mjs`.

Normal KernelOn builds, tests, and source synchronization read only this directory. The
external `open_source` workspace is migration-time reference material and is not a build,
test, or runtime dependency.

The snapshot is intentionally immutable. Platform-neutral UI/runtime adaptations are
generated into the sibling `generated` directory, while Web, Tauri, Worker, and Litestar
adaptations live in their respective KernelOn-owned host and service modules. Do not edit
the snapshot to make an integration pass; change only the audited adapter and record the
adaptation in provenance.
