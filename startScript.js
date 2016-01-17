/**
 * @author <a href="mailto:stefan@stefanmayer.me">Stefan Mayer</a>
 */

var forever = require('forever');
var readLine = require('readline');

module.exports = function startScript(uuid, config) {
    var casaCalidaCommand = require('path').join(__dirname, 'node_modules', 'casa-calida', 'lib', 'index.js');

    forever.list(false, function (err, data) {
        if (data && data.filter(function (script) {
                return script.uid === uuid && !!script.running;
            }).length > 0) {
            console.log('Stopping old process');
            data.forEach(function (script, index) {
                if(script.uid === uuid &&  !!script.running) {
                    forever.stop(index);
                }
            });
        }
        forever.startDaemon(casaCalidaCommand, {
            args: ['config=' + config],
            uid: uuid,
            max: 3,
            silent: true,
            'outFile': 'out.log',
            'errFile': 'err.log'
        });

        setTimeout(function () {
            console.log('Started forever. The process log till now:');
            var errorLines = 0;

            var logReader = readLine.createInterface({
                input: require('fs').createReadStream('out.log')
            });

            logReader.on('line', function (line) {
                console.log(line);
            });

            logReader.on('close', function () {
                var logReader = readLine.createInterface({
                    input: require('fs').createReadStream('err.log')
                });

                logReader.on('line', function (line) {
                    errorLines++;
                    console.error(line);
                });

                logReader.on('close', function () {
                    if (errorLines === 0) {
                        console.log('Everything worked fine.');
                    } else {
                        console.log('There seems to be a problem.');
                    }
                    console.log('Exiting installer');
                    process.exit(0);
                });
            });
        }, 5000);
    });
}
