/**
 * @author <a href="mailto:stefan@stefanmayer.me">Stefan Mayer</a>
 */

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var startScript = require('./startScript');

var uuid = 'd7a0d395-ae02-482d-92fc-73357d515275';

const cliArguments = process.argv.reduce(function (argObject, arg) {
    var argument = arg.split('=');
    if (argument.length === 2) {
        argObject[argument[0]] = argument[1];
    }
    return argObject;
}, {});

if (!cliArguments['config']) {
    console.error('Please provide "config" as arguments to point to your config file. See README for more infos.');
    process.exit(1);
}

const absoluteConfigPath = path.resolve(cliArguments['config']);
try {
    const stats = fs.lstatSync(absoluteConfigPath);

    if (stats.isDirectory()) {
        throw new Error('config is a directory');
    }
} catch (e) {
    console.error('Couldn\'t find provided config file ' + absoluteConfigPath);
    process.exit(2);
}

console.log('Installing casa-calida.');
exec('npm uninstall -g casa-calida', function () {
    exec('npm install -g --production casa-calida',
        function (error, stdout, stderr) {
            console.log(stdout);
            if (stderr) {
                console.log('errors: ' + stderr);
            }
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                start(/^win/.test(process.platform));
            }
        });
});

function start(windows) {
    if (windows) {
        console.log('Windows system detected. Not using crontab.');
    } else {
        console.log('Non-Windows system detected. Using crontab.');

        require('crontab').load(function(err, crontab) {
            if (err) {
                return console.error(err);
            }

            var nodePath = process.execPath.split('/').slice(0, -1).join('/');
            var exportCommand = 'export PATH=' + nodePath + ':$PATH';
            var foreverCommand = require('path').join(__dirname, 'node_modules', 'forever', 'bin', 'forever');
            // var sysCommand = exportCommand + ' && ' + foreverCommand + ' start node_modules/.bin/casa-calida -- config=' + cliArguments['config'];
            var sysCommand = exportCommand + ' && casa-calida config=' + absoluteConfigPath;

            crontab.remove({comment:uuid});
            crontab.create(sysCommand, '@reboot', uuid);

            crontab.save(function(err, crontab) {
                console.log(err);
            });
        });
    }
    startScript(uuid, cliArguments['config']);
}