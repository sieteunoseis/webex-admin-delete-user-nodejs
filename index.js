const axios = require('axios');
const csv = require('csvtojson')
// https://developer.webex.com/docs/api/getting-started
// Scroll down for Your Personal Access Token.
const token = ''
// https://developer.webex.com/docs/api/v1/organizations/list-organizations
const orgID = ''
let usersIds = []
let idPromises = []
const converter = csv()
	.fromFile('./users.csv') // Provide csv with email address of users you wish to bulk delete
	.then((json) => {
		// Lets loop thru the users. No throttling set up on this. May need to re run.
		for (var i = 0, len = json.length; i < len; i++) {
			console.log('Getting ID for ' + json[i]['Email']);
			findUrl = 'https://webexapis.com/v1/people?email=' + json[i]['Email'] + '&orgId=' + orgID
			idPromises.push(
				axios.get(findUrl, {
					headers: {
						'Authorization': 'Bearer ' + token
					}
				}).then(response => {
					// do something with response
					if (response.data.items.length > 0) {
						if (response.data.items[0].hasOwnProperty('id')) {
							usersIds.push(response.data.items[0].id);
						}
					}
				}).catch(error => {
					// 429: Rate Limiting
					// The Webex Teams API rate limits requests. If you receive a 429 Too Many Requests response from the API, your application will need to back off and retry the request after the duration specified in the Retry-After header in the response.
					console.log(error.response.data.message)
				})
			)
		}

		Promise.all(idPromises).then(() => {
			console.log('Retrieved ' + usersIds.length + ' user ids.')
			let deletePromises = []
			let deletedStatus = []

			for (var i = 0, len = usersIds.length; i < len; i++) {
				deleteUrl = 'https://webexapis.com/v1/people/' + usersIds[i]

				deletePromises.push(
					axios.delete(deleteUrl, {
						headers: {
							'Authorization': 'Bearer ' + token
						}
					}).then(response => {
						// do something with response
						deletedStatus.push('Status: ' + response.status + ': Successfully deleted user');
					}).catch(error => {
						// 429: Rate Limiting
						// The Webex Teams API rate limits requests. If you receive a 429 Too Many Requests response from the API, your application will need to back off and retry the request after the duration specified in the Retry-After header in the response.
						console.log(error.response.data.message)
					})
				)

			}

			Promise.all(deletePromises).then(() => console.log('Deleted ' + deletedStatus.length + ' users.'));

		});

	})