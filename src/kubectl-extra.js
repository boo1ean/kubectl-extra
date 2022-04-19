const { createProxy } = require('cli-util-proxy')
const fuzzy = require('fuzzysearch')
const fuzzySort = require('fuzzysort')
const { execSync } = require('child_process')
const cliSelect = require('cli-select')
const debug = require('debug')('kubectl-extra')
const yaml = require('yaml')

createProxy('kubectl')
	.proxy('p l <query>', async (args, done) => {
		const podName = await getPodName(args.params.query)
		if (!podName) {
			console.log('No matching service.')
			return done()
		}
		return `logs ${podName}`
	})
	.appendOptions()
	.proxy('g s <query>', async (args, done) => {
		const secretName = await getSecretName(args.params.query)
		if (!secretName) {
			console.log('No matching secrets.')
			return done()
		}
		const result = execSync(`kubectl get secrets ${secretName} -o yaml`).toString()
		console.log(yaml.stringify(decodeSecrets(yaml.parse(result))))
		done()
	})
	.appendOptions()
	.proxy('cc', () => 'config current-context')
	.run()

function decodeSecrets(config) {
	for (const key in config.data) {
		config.data[key] = Buffer.from(config.data[key], 'base64').toString('utf8')
	}
	return config
}

function getPodName (query) {
	return getResourceNameByQuery(
		'kubectl get pods',
		getPodCleanNameFromLine,
		query
	)
}

function getSecretName (query) {
	return getResourceNameByQuery(
		'kubectl get secrets',
		getResourceNameFromLine,
		query
	)
}

async function getResourceNameByQuery (resoucreQuery, resourceNameGetter, query) {
	debug(`Get resoucre name by query "${resoucreQuery}" "${query}"`)

	const result = execSync(resoucreQuery)
	const matches = result
		.toString()
		.split('\n')
		.slice(1)
		.filter(p => fuzzy(query, resourceNameGetter(p)))
		.map(getResourceNameFromLine)

	let match = matches[0]

	if (matches.length > 1) {
		const sortedMatches = fuzzySort
			.go(query, matches)
			.map(r => r.target)
		const { value } = await cliSelect({ values: sortedMatches })
		match = value
	}

	return match
}

// Remove generated suffixes and concat without separators
function getPodCleanNameFromLine (p) {
	const nameTokens = p.split(' ')[0].split('-')
	return nameTokens.slice(0, -2).join('')
}

function getResourceNameFromLine (p) {
	return p.split(' ')[0]
}
