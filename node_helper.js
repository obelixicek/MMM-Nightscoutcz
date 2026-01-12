const NodeHelper = require("node_helper");
const { fetchData, getDirectionIcon } = require("./helpers.cjs");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
        this.config = null;
        this.updateTimer = null;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "START") {
            this.config = payload;
            this.startFetching();
        }
    },

    startFetching: function() {
        this.fetchDataWrapper();
        
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            this.fetchDataWrapper();
        }, this.config.updateInterval);
    },

    async fetchDataWrapper() {
        try {
            const result = await fetchData(this.config);
            this.sendSocketNotification("DATA", result);
        } catch (error) {
            console.error('Error fetching Nightscout data:', error);
            this.sendSocketNotification("ERROR", error.message);
        }
    },

    stop: function() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
    }
});
