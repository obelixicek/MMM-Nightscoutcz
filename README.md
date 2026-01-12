# MMM-Nightscoutcz

MagicMirror module for displaying glucose data from Nightscout.cz API.

## Installation

1. Navigate to the `modules` folder in your MagicMirror installation:
```bash
cd ~/MagicMirror/modules
```

2. Clone this repository:
```bash
git clone https://github.com/obelixicek/MMM-Nightscoutcz.git
```

3. Remove development files:
```bash
cd MMM-Nightscoutcz
rm -f package.json package-lock.json helpers.test.js MMM-Nightscoutcz.test.js vitest.config.js
rm -rf node_modules
```

## Configuration

Add the following configuration to your `config/config.js` file:

```javascript
{
    module: "MMM-Nightscoutcz",
    position: "top_right",
    config: {
        username: "", // your name in domain
        secret: "", // your password
        updateInterval: 60000,  // 1 minute in ms
        locale: "cs-CZ",
        showDate: false,  // true = date + time, false = time only
        retryDelay: 10000,
        animationSpeed: 1000
    }
}
```

## Configuration Options

| Parameter | Description | Default Value |
|----------|-------|-----------------|
| `username` | Nightscout username (subdomain) | **required** |
| `secret` | Nightscout API secret | **required** |
| `updateInterval` | Update interval in ms | `60000` (1 min) |
| `locale` | Locale for time formatting | `"cs-CZ"` |
| `showDate` | Show date and time | `false` |
| `retryDelay` | Delay on error in ms | `10000` |
| `animationSpeed` | Animation speed on update | `1000` |

## Displayed Information

- **Glucose value** - in mmol/L
- **Measurement time** - time of last update
- **Glucose direction** - arrow showing trend

## License

MIT
