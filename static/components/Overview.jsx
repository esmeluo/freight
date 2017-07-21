var React = require('react');

import api from '../api';

import DeployChart from "./DeployChart";
import LoadingIndicator from './LoadingIndicator';
import PollingMixin from '../mixins/polling';
import TaskSummary from './TaskSummary';
import { browserHistory } from 'react-router';

var Overview = React.createClass({
  mixins: [PollingMixin],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState() {
    return {
      deploys: null,
    };
  },

  componentWillMount(){
    api.request(this.getPollingUrl(), {
      success: (data) => {
        this.setState({
          deploys: data
        });
      }
    });
  },
  componentDidUpdate(prevProps, prevState){
    if(this.state.deploys[0].status === 'finished' && prevState.deploys[0].status === 'in_progress'){
      this.pushNotification()
    }
  },
  getPollingUrl() {
    return '/deploys/';
  },

  pollingReceiveData(data) {
    this.setState({
      deploys: data
    });
    //console.log(data[0])
  },

  deployInProgress(deploy) {
    return deploy.status == 'in_progress';
  },

  deployPending(deploy) {
    return deploy.status == 'pending';
  },

  render() {
    if (this.state.deploys === null) {
      return (
        <div className="container" style={{textAlign: "center"}}>
          <LoadingIndicator>
            <p>Loading list of deploys.</p>
          </LoadingIndicator>
        </div>
      );
    }

    var activedeployNodes = [];
    var pendingdeployNodes = [];
    var previousdeployNodes = [];

    this.state.deploys.forEach((deploy) => {
      var node = <TaskSummary key={deploy.id} task={deploy} />;
      if (this.deployInProgress(deploy)) {
        activedeployNodes.unshift(node);
      } else if (this.deployPending(deploy)) {
        pendingdeployNodes.unshift(node);
      } else {
        previousdeployNodes.push(node);
      }
    });

    return (
      <div>
        <div className="section">
          <div className="section-header">
            <h2>Active Deploys</h2>
          </div>
          {(activedeployNodes.length || pendingdeployNodes.length) ?
            <div className="deploy-list">
              {activedeployNodes}
              {pendingdeployNodes}
            </div>
          :
            <p>There are no active deploys.</p>
          }
        </div>

        <div className="section">
          <div className="section-header">
            <h2>Deploy History</h2>
          </div>

          <DeployChart />

          {previousdeployNodes.length ?
            <div className="deploy-list">
              {previousdeployNodes}
            </div>
          :
            <p>There are no historical deploys.</p>
          }
        </div>
      </div>
    );
  }
});

export default Overview;
