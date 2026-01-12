Module.register("MMM-Nightscoutcz", {
    defaults: {
        username: "foo",
        secret: "bar",
        updateInterval: 60000, // 1 minute
        locale: "cs-CZ",
        showDate: false, // true = display date + time, false = time only
        retryDelay: 10000,
        animationSpeed: 1000,
    },

    // Initialize variables
    glucoseData: null,
    loaded: false,
    error: null,

    start: function() {
        Log.info("Starting module: " + this.name);
        console.log("[MMM-Nightscoutcz] Module started with config:", this.config);
        this.glucoseData = null;
        this.loaded = false;
        this.error = null;
        this.sendSocketNotification("START", this.config);
        console.log("[MMM-Nightscoutcz] Socket notification START sent");
    },

    getDom: function() {
        console.log("[MMM-Nightscoutcz] getDom called - loaded:", this.loaded, "error:", this.error, "data:", this.glucoseData);
        
        const wrapper = document.createElement("div");
        wrapper.className = "nightscout-wrapper";

        try {
            if (this.error) {
                console.log("[MMM-Nightscoutcz] Showing error:", this.error);
                wrapper.innerHTML = `<div class="error">${this.error}</div>`;
                return wrapper;
            }

            if (!this.loaded) {
                console.log("[MMM-Nightscoutcz] Showing loading message");
                wrapper.innerHTML = "Loading data...";
                return wrapper;
            }

            if (!this.glucoseData) {
                console.log("[MMM-Nightscoutcz] No data available");
                wrapper.innerHTML = "No data";
                return wrapper;
            }

            // Data validation
            if (!this.glucoseData.directionIcon || !this.glucoseData.sg || !this.glucoseData.date) {
                console.error("[MMM-Nightscoutcz] Invalid data structure:", this.glucoseData);
                wrapper.innerHTML = "Invalid data";
                return wrapper;
            }

            console.log("[MMM-Nightscoutcz] Rendering data:", this.glucoseData);

            // Main container
            const container = document.createElement("div");
            container.className = "nightscout-container";

            // Direction icon
            const iconWrapper = document.createElement("div");
            iconWrapper.className = "direction-icon";
            const icon = document.createElement("i");
            icon.className = `fa-solid fa-${this.glucoseData.directionIcon}`;
            iconWrapper.appendChild(icon);

            // Glucose value
            const sgWrapper = document.createElement("div");
            sgWrapper.className = "sg-value";
            sgWrapper.innerHTML = `${this.glucoseData.sg}<span class="unit">mmol/L</span>`;

            // Time
            const timeWrapper = document.createElement("div");
            timeWrapper.className = "time";
            timeWrapper.innerHTML = this.glucoseData.date;

            container.appendChild(sgWrapper);
            container.appendChild(iconWrapper);
            container.appendChild(timeWrapper);
            wrapper.appendChild(container);

            return wrapper;
        } catch (error) {
            console.error("[MMM-Nightscoutcz] Error in getDom:", error);
            wrapper.innerHTML = `<div class="error">Render error: ${error.message}</div>`;
            return wrapper;
        }
    },

    getStyles: function() {
        return [
            "MMM-Nightscoutcz.css",
            "font-awesome.css"
        ];
    },

    socketNotificationReceived: function(notification, payload) {
        console.log("[MMM-Nightscoutcz] Socket notification received:", notification, payload);
        if (notification === "DATA") {
            this.glucoseData = payload;
            this.loaded = true;
            this.error = null;
            console.log("[MMM-Nightscoutcz] Data received, updating DOM:", this.glucoseData);
            this.updateDom(this.config.animationSpeed);
        } else if (notification === "ERROR") {
            this.error = payload;
            this.loaded = true;
            console.log("[MMM-Nightscoutcz] Error received, updating DOM:", this.error);
            this.updateDom(this.config.animationSpeed);
        }
    },
});
