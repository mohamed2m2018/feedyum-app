import {FFmpegKit} from 'ffmpeg-kit-react-native';
import {createThumbnail} from 'react-native-create-thumbnail';
import RNFS from 'react-native-fs';

export const convertVideoToMP4 = async inputPath => {
  console.log('the input path is ', inputPath);

  const outputFile = `${RNFS.CachesDirectoryPath}/output.mp4`;

  await FFmpegKit.execute(
    ` -y -i ${inputPath} -c:v libx264 -preset veryfast -crf 28 -c:a copy ${outputFile}`,
  );

  return outputFile;
};

export const generateThumbnail = async inputPath => {
  try {
    const uri = await createThumbnail({
      url: inputPath,
      timeStamp: 10000,
    });

    return uri;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
};
