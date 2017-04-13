var regressed = false;
var chalk = require('chalk');
var allMetrics = 'lines statements functions branches'.split(' ');

/**
 * pretty print difference in coverage
 *
 * @param diff {object} - the diff'd hash
 * @param options {object} -
 *   options.nocolor {boolean} - don't use ANSI colors in output message
 *   options.nomotivate {boolean} - don't add motivation message
 *   options.detail {string} - comma separated list of: lines,statements,functions,branches
 * @returns {msg: String, regressed: Boolean}
 */
function print(diff, options) {
  options = Object.assign({}, options || {});
  var detail = options.detail || 'lines',
    details, msg, result;

  if (!diff) return {};
  if (detail === true) {
    details = allMetrics;
  } else if (detail) {
    details = detail.split(',');
  }

  if (details.length > 1) {
    msg = 'Coverage delta: ' + details.map(function(what) {
        return print_item(diff, what, options);
      }).join(', ');
  } else {
    delete options.detail;
    msg = print_item(diff, details[0], options);
  }

  result = {
    msg: msg,
    regressed: regressed
  };

  // reset regressed
  regressed = false;
  return result;
}


function print_item(diff, what, options) {
  var item = diff.total || diff[Object.keys(diff)[0]];
  if (!item) return '';

  // --pick formats
  //    --pick lines.pct
  if (typeof(item) === 'number') return _out({pct: item}, options.pick);

  //   --pick lines
  var name = options.pick;
  delete options.pick;
  if ('pct' in item) return _out(item, name);

  if (!allMetrics.includes(what)) return 'No such coverage metric: ' + what;
  if (!item || !(what in item)) return 'No coverage difference in ' + what;

  var metric = item[what];
  return _out(metric, what);

  function _out(metric, metricName) {
    var
      inc = metric.pct > 0,
      dir = inc ? 'increased' : 'decreased',
      sign = inc ? '+' : '',
      c = options.nocolor ? function(a){return a} : (inc ? chalk.green : chalk.red),
      compliment = !options.nomotivate ? ' ' + getCompliment(inc) : '',
      pickTmpl = c(`Coverage ${dir} ${sign}${metric.pct} for ${metricName}.`) + compliment,
      detailTmpl = c(`${sign}${metric.pct}% (${sign}${metric.covered}) ${metricName}`),
      simpleTmpl = c(`Coverage ${dir} ${sign}${metric.pct}% (${sign}${metric.covered}) ${metricName}.`) + compliment;

    regressed = regressed || !inc;
    return options.pick ? pickTmpl : options.detail ? detailTmpl : simpleTmpl;
  }
}


function getCompliment(good) {
  var nicejob = require('nicejob');
  return good ? nicejob() + '.' : nicejob.not() + '!';
}

print.compliment = getCompliment;

module.exports = print;