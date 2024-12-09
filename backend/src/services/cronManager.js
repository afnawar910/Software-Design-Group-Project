const cron = require('node-cron');

class CronManager {
	constructor() {
		this.tasks = new Map();
	}

	schedule(name, cronExpression, callback) {
		if (this.tasks.has(name)) {
			const existingTask = this.tasks.get(name);
			existingTask.stop();
		}

		const task = cron.schedule(cronExpression, callback);
		this.tasks.set(name, task);
		return task;
	}

	stopAll() {
		for (const task of this.tasks.values()) {
			task.stop();
		}
		this.tasks.clear();
	}

	destroy() {
		this.stopAll();
	}
}

module.exports = new CronManager();