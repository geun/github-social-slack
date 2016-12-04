
/**
 * Module dependencies.
 */

var post = require('./request').post;
var fmt = require('./fmt');

/**
 * Post to slack!
 */

module.exports = function *(body) {
  var uri = process.env.SLACK_POST_URL || '';
  for (var i = 0; i < body.length; i++) {
    yield post(uri, fmtSlack(body[i]));
  }
};

/**
 * Helper function to format activity to how slack wants it.
 */

function fmtSlack(event) {
  switch (event.type) {
    case 'PullRequestEvent':
      var text_fmt = 'Opened pull request ' + friendly(event.payload.pull_request.url);
      break;
    case 'CreateEvent':
      if (!event.payload.ref) {
        var text_fmt = 'Created repository ' + friendly(event.repo.url);
      } else {
        var text_fmt = 'Created branch ' + friendly(event.repo.url + '/tree/' + event.payload.ref);
      }
      break;
    case 'IssueCommentEvent':
      var text_fmt = 'Commented ' + event.payload.comment.html_url;
      break;
    case 'WatchEvent':
      var text_fmt = 'Starred ' + friendly(event.repo.url);
      break;
    default:
      var text_fmt = fmt('%s, %s', event.type, friendly(event.repo.url));
  }
  return JSON.stringify({
    username: event.actor.login || 'GitHub Party Bot',
    text: text_fmt,
    unfurl_links: true,
    icon_url: event.actor.avatar_url || 'https://raw.githubusercontent.com/lambtron/github-social-slack/master/img/github-slack.png'
  });
}

/**
 * Make API link user-friendly.
 *
 * https://api.github.com/repos/alphagov/whitehall
 *
 * to
 *
 * https://github.com/alphagov/whitehall
 */

function friendly(uri) {
  return uri.replace('api.', '').replace('/repos', '');
}
