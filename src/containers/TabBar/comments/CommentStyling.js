import { StyleSheet } from 'react-native';
import { moderateScale } from '../../../common/constants';

export default styles = StyleSheet.create({
  // Main comment container with card-like appearance
  commentCard: {
    flexDirection: 'row',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    marginHorizontal: moderateScale(4),
    marginBottom: moderateScale(8),
    borderRadius: moderateScale(16),
    // Shadow will be applied dynamically based on theme
  },

  // Avatar styles
  avatarContainer: {
    marginRight: moderateScale(12),
  },

  image: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    borderWidth: 2,
    // Border color will be applied dynamically
  },

  replyImage: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    // Border color will be applied dynamically
  },

  // Content wrapper
  contentWrapper: {
    flex: 1,
    paddingRight: moderateScale(8),
  },

  // Username with modern typography
  commentOwner: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: moderateScale(2),
  },

  // Comment content
  content: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    fontWeight: '400',
    marginBottom: moderateScale(8),
  },

  // Footer with actions
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },

  replyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },

  // Footer elements (time, reply, delete)
  footerElement: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginRight: moderateScale(16),
    opacity: 0.7,
  },

  footerAction: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginRight: moderateScale(16),
  },

  footerElementLiked: {
    marginRight: moderateScale(12),
    color: '#FF2D55',
  },

  // Like button column
  likeColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: moderateScale(4),
    minWidth: moderateScale(40),
  },

  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
  },

  likeCount: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    marginTop: moderateScale(2),
    opacity: 0.8,
  },

  // Delete button
  deleteButton: {
    padding: moderateScale(6),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(4),
  },

  // Reply section
  replyContainer: {
    marginLeft: moderateScale(24),
    marginTop: moderateScale(4),
    paddingLeft: moderateScale(16),
    borderLeftWidth: 2,
    // Border color will be applied dynamically
  },

  replyCard: {
    flexDirection: 'row',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    marginBottom: moderateScale(6),
    borderRadius: moderateScale(12),
  },

  // Separator line between comments
  separator: {
    height: 1,
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(4),
    opacity: 0.1,
  },

  // Legacy support (to be removed gradually)
  mainWrapper: {
    flexDirection: 'row',
  },

  wrapper: {
    flex: 1,
    borderRadius: moderateScale(12),
  },
});
