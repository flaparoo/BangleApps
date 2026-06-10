# CheckWX Module

This is a module/library to use the [CheckWX](https://www.checkwxapi.com/)
Aviation Weather API. It doesn't include an app.


## Configuration

You will need an CheckWX account (see above for link) and generate an API
key. The free plan is normally sufficient, but please consider supporting
them.

After installing the module on your Bangle, use the "interface" page (floppy
disk icon) in the App Loader to set the API key.


## Usage

Include the module in your app with:

	const checkwx = require('checkwx');

Then use the exported function, for example to get the latest METAR from the
nearest station to a lat/lon coordinate pair:

	reqID = checkwx.request('v2/metar/lat/'+lat+'/lon/'+lon+'/short',
	                        'limit=1',
	                        data => { console.log(data); },
	                        error => { console.log(error); });

The returned reqID can be useful to track whether a request has already been
made (ie. the app is still waiting on a response).

Please consult the [CheckWX documentation](https://www.checkwxapi.com/documentation)
for information about the available end-points and request parameters.


## Author

Flaparoo [github](https://github.com/flaparoo)

