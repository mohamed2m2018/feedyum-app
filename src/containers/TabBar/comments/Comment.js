import React, {Component} from 'react';

import {View, Text, Image, TouchableOpacity} from 'react-native';

import PropTypes from 'prop-types';

import commentStyling from './CommentStyling';

import TimeAgo from 'javascript-time-ago';

// English.
import en from 'javascript-time-ago/locale/en';

import Reply from './Reply';

export default class Comment extends Component {
  state = {
    liked: false,
  };

  componentWillMount = () => {
    const {displayLike} = this.props;
    this.setState({
      liked: displayLike,
    });
  };

  onPress = (_id, index) => {
    this.props.inputRef.current.focus();
    this.props.scrollToComment(index);
    this.props.onAddComment(_id);
  };

  onPressLike = () => {
    this.setState({
      liked: !this.state.liked,
    });
  };

  renderReplies = replies => {
    return replies.map((reply, index) => (
      <View key={index}>
        <Reply reply={reply} />
      </View>
    ));
  };

  render() {
    const {commentData} = this.props;
    const {
      content,
      user_id: {fullName, avatar},
      replies,
      created_at,
      _id,
    } = commentData;
    const {liked} = this.state;

    // Create formatter (English).
    const timeAgo = new TimeAgo('en-US');
    const date = new Date(created_at);
    const time = timeAgo.format(date);

    return (
      <View>
        <View style={commentStyling.mainWrapper}>
          <Image style={commentStyling.image} source={{uri: avatar}} />
          <View style={commentStyling.wrapper}>
            <Text style={commentStyling.commentOwner}>{fullName}</Text>
            <Text style={commentStyling.content}>{content}</Text>
          </View>
        </View>
        <View style={commentStyling.commentFooter}>
          <Text style={commentStyling.footerElement}>{time}</Text>

          {/* {liked ? (
            <TouchableOpacity onPress={this.onPressLike}>
              <View style={{paddingRight: 5, paddingLeft: 5}}>
                <Text style={commentStyling.footerElementLiked}>Like</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={this.onPressLike}>
              <View style={{paddingRight: 4, paddingLeft: 4}}>
                <Text style={commentStyling.footerElement}>Like</Text>
              </View>
            </TouchableOpacity>
          )} */}

          <TouchableOpacity onPress={() => this.onPress(_id, this.props.index)}>
            <Text style={commentStyling.footerElement}>Reply</Text>
          </TouchableOpacity>
          {/* <Text style={commentStyling.footerElement}>12 likes</Text> */}
        </View>
        {replies ? this.renderReplies(replies) : null}
      </View>
    );
  }
}

Comment.propTypes = {
  commentData: PropTypes.shape({
    ownerName: PropTypes.string.isRequired,
    ownerAvatar: PropTypes.string,
    content: PropTypes.string.isRequired,
    date: PropTypes.string,
    liked: PropTypes.bool,
    replies: PropTypes.arrayOf(
      PropTypes.shape({
        ownerName: PropTypes.string,
        ownerAvatar: PropTypes.string,
        content: PropTypes.string.isRequired,
        date: PropTypes.string,
      }),
    ),
  }),
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  displayLike: PropTypes.bool,
};
