from __future__ import absolute_import, unicode_literals

import json
import responses

from urlparse import parse_qs

from ds import notifiers
from ds.notifiers import NotifierEvent
from ds.models import TaskStatus
from ds.testutils import TestCase


class SlackNotifierBase(TestCase):
    def setUp(self):
        self.notifier = notifiers.get('slack')
        self.user = self.create_user()
        self.repo = self.create_repo()
        self.app = self.create_app(repository=self.repo)
        self.task = self.create_task(
            app=self.app,
            user=self.user,
            status=TaskStatus.finished,
        )


class SlackNotifierTest(SlackNotifierBase):
    @responses.activate
    def test_send_finished_task(self):
        responses.add(responses.POST, 'http://example.com/')

        config = {'webhook_url': 'http://example.com/'}

        self.notifier.send(self.task, config, NotifierEvent.TASK_FINISHED)

        call = responses.calls[0]
        assert len(responses.calls) == 1
        assert responses.calls[0].request.url == 'http://example.com/'
        body = parse_qs(responses.calls[0].request.body)
        payload = json.loads(body['payload'][0])
        # TODO(dcramer): we probably shouldnt hardcode this, but it'll do for now
        assert payload == {
            'parse': 'none',
            'text': "Successfully deployed {}#1 ({}) to production ({}s)".format(
                self.app.name, self.task.sha[:7], self.task.duration),
        }

    @responses.activate
    def test_send_started_task(self):
        responses.add(responses.POST, 'http://example.com/')

        config = {'webhook_url': 'http://example.com/'}

        self.notifier.send(self.task, config, NotifierEvent.TASK_STARTED)

        call = responses.calls[0]
        assert len(responses.calls) == 1
        assert responses.calls[0].request.url == 'http://example.com/'
        body = parse_qs(responses.calls[0].request.body)
        payload = json.loads(body['payload'][0])
        # TODO(dcramer): we probably shouldnt hardcode this, but it'll do for now
        assert payload == {
            'parse': 'none',
            'text': "Deploying {}#1 (master) to production".format(self.app.name),
        }