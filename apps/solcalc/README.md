# Solar Calculations Module

This is a module/library to calculate the Sunrise, Sunset and Solar Noon. It doesn't include an app.

It exports the following functions:
- sunriseAsString: returns the (local) time of the Sunrise
- sunsetAsString: returns the (local) time of the Sunset
- solarNoonAsString: return the (local) time of the Solar Noon


## How to use the Module

Include the module in your app with:

	const solcalc = require('solcalc');

Then use the exported functions, for example:

	var now = new Date();
	var lat = -31.95; var lon = 115.86;
	var sunrise = sunriseAsString(now, lat, lon);
	var sunset = sunsetAsString(now, lat, lon);
	var solnoon = solarNoonAsString(now, lon);

The solarNoonAsString function accepts a 3rd argument: 2 -> HH:MM, 3 -> HH:MM:SS


