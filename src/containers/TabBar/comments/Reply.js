import React, {Component} from 'react';
import {View, Text, Image, TouchableHighlight} from 'react-native';
import commentStyling from './CommentStyling';
import PropTypes from 'prop-types';
import TimeAgo from 'javascript-time-ago';

export default class Reply extends Component {
  render() {
    const {reply} = this.props;
    const timeAgo = new TimeAgo('en-US');
    const date = new Date(reply?.created_at);
    const time = timeAgo.format(date);
    return (
      <View>
        <View style={commentStyling.mainWrapper}>
          <Image
            style={commentStyling.replyImage}
            source={{uri: reply?.user_id?.avatar}}
          />
          <View style={commentStyling.wrapper}>
            <Text style={commentStyling.commentOwner}>
              {reply.user_id?.fullName}
            </Text>
            <Text style={commentStyling.content}>{reply.content}</Text>
          </View>
        </View>
        <View style={commentStyling.replyFooter}>
          <Text style={commentStyling.footerElement}>{time}</Text>
          <Text style={commentStyling.footerElement}>{reply.date}</Text>
          {/* <TouchableHighlight onPress={this.onPress}>
            <Text style={commentStyling.footerElement}>Like</Text>
          </TouchableHighlight>
          <Text style={commentStyling.footerElement}>12 likes</Text> */}
        </View>
      </View>
    );
  }
}

Reply.propTypes = {
  reply: PropTypes.shape({
    ownerName: PropTypes.string.isRequired,
    ownerAvatar: PropTypes.string,
    content: PropTypes.string.isRequired,
    date: PropTypes.string,
    liked: PropTypes.bool,
  }),
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
};
