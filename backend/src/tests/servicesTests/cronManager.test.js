const cronManager = require('../../services/cronManager');

describe('CronManager', () => {
	beforeEach(() => {
		cronManager.stopAll();
	});

	afterEach(() => {
		cronManager.destroy();
	});

	it('should schedule a new cron job', () => {
		const callback = jest.fn();
		const task = cronManager.schedule('test-task', '* * * * *', callback);

		expect(task).toBeDefined();
		expect(cronManager.tasks.size).toBe(1);
		expect(cronManager.tasks.has('test-task')).toBe(true);
	});

	it('should schedule multiple cron jobs', () => {
		const callback1 = jest.fn();
		const callback2 = jest.fn();

		cronManager.schedule('task1', '* * * * *', callback1);
		cronManager.schedule('task2', '*/5 * * * *', callback2);

		expect(cronManager.tasks.size).toBe(2);
		expect(cronManager.tasks.has('task1')).toBe(true);
		expect(cronManager.tasks.has('task2')).toBe(true);
	});

	it('should stop all running cron jobs', () => {
		const callback1 = jest.fn();
		const callback2 = jest.fn();

		const task1 = cronManager.schedule('task1', '* * * * *', callback1);
		const task2 = cronManager.schedule('task2', '*/5 * * * *', callback2);

		jest.spyOn(task1, 'stop');
		jest.spyOn(task2, 'stop');

		cronManager.stopAll();

		expect(task1.stop).toHaveBeenCalled();
		expect(task2.stop).toHaveBeenCalled();
		expect(cronManager.tasks.size).toBe(0);
	});

	it('should properly destroy all tasks', () => {
		const callback = jest.fn();
		const task = cronManager.schedule('test-task', '* * * * *', callback);

		jest.spyOn(cronManager, 'stopAll');

		cronManager.destroy();

		expect(cronManager.stopAll).toHaveBeenCalled();
		expect(cronManager.tasks.size).toBe(0);
	});

	it('should handle stopping tasks when no tasks exist', () => {
		expect(() => cronManager.stopAll()).not.toThrow();
		expect(cronManager.tasks.size).toBe(0);
	});

	it('should handle destroying when no tasks exist', () => {
		expect(() => cronManager.destroy()).not.toThrow();
		expect(cronManager.tasks.size).toBe(0);
	});

	it('should replace existing task with same name', () => {
		const callback1 = jest.fn();
		const callback2 = jest.fn();

		const task1 = cronManager.schedule('same-task', '* * * * *', callback1);
		jest.spyOn(task1, 'stop');

		const task2 = cronManager.schedule('same-task', '*/5 * * * *', callback2);

		expect(task1.stop).toHaveBeenCalled();
		expect(cronManager.tasks.size).toBe(1);
		expect(cronManager.tasks.get('same-task')).toBe(task2);
	});
});