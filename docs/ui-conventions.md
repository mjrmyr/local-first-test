# UI Conventions

## Required vs Optional Fields

Required form fields display an asterisk (`*`) after the label. Optional fields have no indicator.

Do **not** use placeholder text to distinguish required from optional fields. Placeholders are reserved for input formatting hints (e.g. `mm:ss`) — never for communicating whether a field is required.

### Implementation

- `FormField` accepts a `required` prop. When `true`, a red asterisk is rendered next to the label.
- Every `FormField` that wraps a required input must set `required`.
- Optional fields simply omit the `required` prop.
