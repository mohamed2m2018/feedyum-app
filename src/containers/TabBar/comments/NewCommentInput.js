import React, {Component} from 'react';
import {
  View,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import commentListStyling from './commentListStyling';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default class componentName extends Component {
  state = {
    text: '',
  };

  render() {
    return (
      <KeyboardAvoidingView behavior="padding" enabled>
        <View style={commentListStyling.textInputContainer}>
          <TextInput
            ref="TextInput"
            onChangeText={text => {
              this.setState({text});
            }}
            placeholderTextColor="#C3C5C8"
            style={commentListStyling.textInput}
            multiline={true}
            placeholder="Write a comment.."
          />
          <TouchableOpacity onPress={this.addComment}>
            <Icon
              style={commentListStyling.icon}
              name="send"
              size={30}
              color="#3179E8"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
}
