
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
  var text_fmt;
  var unfurl_allowance = true;
  switch (event.type) {
    case 'PullRequestEvent':
      if (event.payload.action == 'closed') {
        text_fmt = 'Merged/Closed pull request ' + event.payload.pull_request.html_url;
      } else {
        text_fmt = 'Opened pull request ' + event.payload.pull_request.html_url;
      }
      break;
    case 'CreateEvent':
      if (!event.payload.ref) {
        text_fmt = 'Created repository ' + friendly(event.repo.url);
      } else {
        text_fmt = 'Created branch ' + friendly(event.repo.url + '/tree/' + event.payload.ref);
      }
      break;
    case 'IssuesEvent':
      if (event.payload.action == 'opened') {
        text_fmt = 'Opened issue ' + event.payload.issue.html_url;
      } else {
        text_fmt = 'Closed issue ' + event.payload.issue.html_url;
      }
      break;
    case 'IssueCommentEvent':
      text_fmt = 'Commented on issue ' + event.payload.comment.html_url + '\n\r' + '> ' + event.payload.comment.body;
      unfurl_allowance = false;
      break;
    case 'WatchEvent':
      text_fmt = 'Starred ' + friendly(event.repo.url);
      break;
    case 'DeleteEvent':
      text_fmt = 'Deleted branch ' +  '`'+event.payload.ref+'`' + ' from ' + friendly(event.repo.url);
      break;
    case 'PushEvent':
      var branch = event.payload.ref.substr(event.payload.ref.lastIndexOf('/') + 1);
      var commit_url = 'https://github.com' + "/" + event.repo.name + "/commit/" + event.payload.head;
      text_fmt = 'Pushed to `' + branch + '` at ' + friendly(event.repo.url) + '\n\r' + commit_url;
      break;
    case 'ForkEvent':
      text_fmt = 'Forked `' + event.repo.name + '` to ' + event.payload.forkee.html_url;
      break;
    case 'PublicEvent':
      text_fmt = 'Made ' + friendly(event.repo.url) + ' public';
      break;
    case 'PullRequestReviewCommentEvent':
      text_fmt = 'Commented on pull request ' + event.payload.comment.html_url + '\n\r' + '> ' + event.payload.comment.body;
      break;
    default:
      text_fmt = fmt('%s, %s', event.type, friendly(event.repo.url));
  }
  return JSON.stringify({
    username: event.actor.login || 'GitHub Party Bot',
    text: text_fmt,
    unfurl_links: unfurl_allowance,
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
