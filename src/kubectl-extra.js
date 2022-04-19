const { createProxy } = require('cli-util-proxy')
const fuzzy = require('fuzzysearch')
const fuzzySort = require('fuzzysort')
const { execSync } = require('child_process')
const cliSelect = require('cli-select')

createProxy('kubectl')
	.proxy('p l <query>', async (args, done) => {
		const result = execSync('kubectl get pods')
		const matches = result
			.toString()
			.split('\n')
			.slice(1)
			.filter(p => fuzzy(args.params.query, getPodCleanNameFromLine(p)))
			.map(getPodNameFromLine)

		let match = matches[0]

		if (matches.length > 1) {
			const sortedMatches = fuzzySort.go(
				args.params.query,
				matches
			).map(r => r.target)

			const { value } = await cliSelect({
				values: sortedMatches
			})

			match = value
		}

		if (!match) {
			console.log('No matching service.')
			return done()
		}

		return `logs ${match}`
	})
	.appendOptions()
	.run()


// Remove generated suffixes and concat without separators
function getPodCleanNameFromLine (p) {
	const nameTokens = p.split(' ')[0].split('-')
	return nameTokens.slice(0, -2).join('')
}

function getPodNameFromLine (p) {
	return p.split(' ')[0]
}
