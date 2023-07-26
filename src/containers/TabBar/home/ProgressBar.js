'use strict';

import React, {Component} from 'react';
import {PanResponder, StyleSheet, View, Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

class ProgressBar extends Component {
  constructor(props) {
    super(props);

    this._panResponder = {};
    this._background = 'red';
    this._processStyle = {};
    this.progress = null;
  }

  static defaultProps = {
    currentTime: -0.01,
    duration: 0.0,
    startSeekVideo: () => {
      // callback for video to do something while users start seeking video;
      // suggest to pause video;
      // e.g. setState({paused: true}) in callback function of video component
    },
    endSeekVideo: time => {
      // callback for video to do something when users finish seeking video;
      // seek(time) function is required;
      // if users paused video at startSeekVidoe, this is the place to resume video
    },
    styles: {
      full_progress_bg: 'lightblue',
      active_progress_bg: 'red',
      bar_width: width,
      bar_height: 10,
    },
  };

  componentWillMount() {
    // init panResponder

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: this._handlePanResponderTerminate,
    });

    this._processStyle = {
      style: {
        width: 0,
      },
    };
  }

  componentWillReceiveProps(nextProps) {
    this._processStyle.style.width =
      width *
      this._getProgressPercentage(nextProps.currentTime, nextProps.duration);

    //update only if user select new time

    if (nextProps.currentTime !== this.props.currentTime) {
      this._updateProgress();
    }
  }

  componentDidMount() {
    this._updateProgress();
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.progressContainer,
            {
              width: this.props.styles.barWidth,
              height: this.props.styles.bar_height,
              backgroundColor: this.props.styles.full_progress_bg,
            },
          ]}
          {...this._panResponder.panHandlers}>
          <View
            ref={progress => {
              this.progress = progress;
            }}
            style={[
              styles.rect,
              {
                backgroundColor: this.props.styles.active_progress_bg,
                height: this.props.styles.bar_height,
              },
            ]}
            {...this._panResponder.panHandlers}
          />
        </View>
      </View>
    );
  }

  _updateProgress() {
    //update progress bar position
    this.progress && this.progress.setNativeProps(this._processStyle);
  }

  _handleStartShouldSetPanResponder = (e, gestureState) => {
    // set true become active when users press down on the processbar.
    // set false to disable
    return true;
  };

  _handleMoveShouldSetPanResponder = (e, gestureState) => {
    // set true become active when users move a touch over the processbar.
    // set false to disable
    return true;
  };

  _handlePanResponderGrant = (e, gestureState) => {
    //users first press down on the processbar
    this.props.startSeekVideo();
    console.log(gestureState.x0)
    this._processStyle.style.width = gestureState.x0 -15;
    this._updateProgress();
    var _time =
      this._getProgressPercentage(this._processStyle.style.width, width) *
      this.props.duration;
    console.log(_time);
    this.props.endSeekVideo(_time);
  };

  _handlePanResponderMove = (e, gestureState) => {
    //users move over the process bar without release the press.
    this._processStyle.style.width = gestureState.moveX;
    this._updateProgress();
    var _time =
      this._getProgressPercentage(this._processStyle.style.width, width) *
      this.props.duration;
    console.log(_time);
    this.props.endSeekVideo(_time);
  };

  _handlePanResponderEnd = (e, gestureState) => {
    //users release the press from the actived progress bar
    var _time =
      this._getProgressPercentage(this._processStyle.style.width, width) *
      this.props.duration;
    console.log(_time);
    this.props.endSeekVideo(_time);
  };

  _handlePanResponderTerminate = (e, gestureState) => {
    //users release the press from other place instead of the actived progress bar
  };

  _getProgressPercentage(current, total) {
    if (current > 0) {
      return parseFloat(current) / parseFloat(total);
    } else {
      return 0;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  rect: {
    borderWidth: 1,
    borderColor: 'black',
    position: 'absolute',
  },
  progressContainer: {
    borderColor: 'green',
    borderWidth: 1,
  },
});

export default ProgressBar;
