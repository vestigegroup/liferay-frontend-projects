/**
 * SPDX-FileCopyrightText: © 2019 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

const log = require('../../src/utils/log');
const spawnMultiple = require('../../src/utils/spawnMultiple');
const {SpawnError} = require('../../src/utils/spawnSync');

jest.mock('../../src/utils/log');

describe('spawnMultiple()', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('succeeds when all jobs succeed', () => {
		expect(() =>
			spawnMultiple(
				() => {},
				() => {}
			)
		).not.toThrow();
	});

	it('allows all jobs to run even if one fails', async () => {
		const jobs = [
			jest.fn(),
			jest.fn(() => {
				throw new SpawnError('Boom');
			}),
			jest.fn(),
		];

		await expect(spawnMultiple(...jobs)).rejects.toThrow(SpawnError);

		expect(jobs[0]).toBeCalled();
		expect(jobs[1]).toBeCalled();
		expect(jobs[2]).toBeCalled();
	});

	it('aborts immediately given a non-SpawnError error', async () => {
		const jobs = [
			jest.fn(),
			jest.fn(() => {
				throw new Error('Boom');
			}),
			jest.fn(),
		];

		await expect(spawnMultiple(...jobs)).rejects.toThrow(Error);

		expect(jobs[0]).toBeCalled();
		expect(jobs[1]).toBeCalled();
		expect(jobs[2]).not.toBeCalled();
	});

	it('logs the text of a SpawnError', async () => {
		await expect(
			spawnMultiple(() => {
				throw new SpawnError('Foo');
			})
		).rejects.toThrow();

		expect(log).toBeCalledWith('Foo');
	});

	it('re-throws a SpawnError containing a summary', async () => {
		await expect(
			spawnMultiple(
				() => {},
				() => {
					throw new SpawnError('Boom');
				}
			)
		).rejects.toThrow(/1 of 2 jobs failed/);
	});
});
