import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import type { Alignment } from '../../contexts/messageContext/MessageContext';
import type { MessageOverlayContextValue } from '../../contexts/messageOverlayContext/MessageOverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  LOLReaction,
  LoveReaction,
  ThumbsDownReaction,
  ThumbsUpReaction,
  Unknown,
  WutReaction,
} from '../../icons';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ReactionData } from '../../utils/utils';

const styles = StyleSheet.create({
  avatarContainer: {
    padding: 8,
  },
  avatarInnerContainer: {
    alignSelf: 'center',
  },
  avatarName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    paddingTop: 6,
    textAlign: 'center',
  },
  avatarNameContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
  },
  container: {
    alignItems: 'center',
    borderRadius: 16,
    marginTop: 8,
    width: '100%',
  },
  flatListContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  flatListContentContainer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  reactionBubble: {
    alignItems: 'center',
    borderRadius: 24,
    justifyContent: 'center',
    position: 'absolute',
  },
  reactionBubbleBackground: {
    borderRadius: 24,
    height: 24,
    position: 'absolute',
    width: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    paddingTop: 16,
  },
  unseenItemContainer: {
    opacity: 0,
    position: 'absolute',
  },
});

const reactionData: ReactionData[] = [
  {
    Icon: LoveReaction,
    type: 'love',
  },
  {
    Icon: ThumbsUpReaction,
    type: 'like',
  },
  {
    Icon: ThumbsDownReaction,
    type: 'sad',
  },
  {
    Icon: LOLReaction,
    type: 'haha',
  },
  {
    Icon: WutReaction,
    type: 'wow',
  },
];

export type Reaction = {
  alignment: Alignment;
  id: string;
  name: string;
  type: string;
  image?: string;
};

export type OverlayReactionsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageOverlayContextValue<StreamChatGenerics>, 'OverlayReactionsAvatar'> & {
  reactions: Reaction[];
  showScreen: Animated.SharedValue<number>;
  title: string;
  alignment?: Alignment;
  supportedReactions?: ReactionData[];
};

type ReactionIconProps = Pick<Reaction, 'type'> & {
  pathFill: string;
  size: number;
  supportedReactions: ReactionData[];
};

const ReactionIcon = ({ pathFill, size, supportedReactions, type }: ReactionIconProps) => {
  const Icon = supportedReactions.find((reaction) => reaction.type === type)?.Icon || Unknown;
  return <Icon height={size} pathFill={pathFill} width={size} />;
};

/**
 * OverlayReactions - A high level component which implements all the logic required for message overlay reactions
 */
export const OverlayReactions = (props: OverlayReactionsProps) => {
  const {
    alignment: overlayAlignment,
    OverlayReactionsAvatar,
    reactions,
    showScreen,
    supportedReactions = reactionData,
    title,
  } = props;
  const layoutHeight = useSharedValue(0);
  const layoutWidth = useSharedValue(0);

  const [itemHeight, setItemHeight] = React.useState(0);

  const {
    theme: {
      colors: { accent_blue, black, grey_gainsboro, white },
      overlay: {
        padding: overlayPadding,
        reactions: {
          avatarContainer,
          avatarName,
          avatarSize,
          container,
          flatListContainer,
          radius,
          reactionBubble,
          reactionBubbleBackground,
          reactionBubbleBorderRadius,
          title: titleStyle,
        },
      },
    },
  } = useTheme();

  const width = useWindowDimensions().width;

  const supportedReactionTypes = supportedReactions.map(
    (supportedReaction) => supportedReaction.type,
  );

  const filteredReactions = reactions.filter((reaction) =>
    supportedReactionTypes.includes(reaction.type),
  );

  const numColumns = Math.floor(
    (width -
      overlayPadding * 2 -
      ((Number(flatListContainer.paddingHorizontal || 0) ||
        styles.flatListContainer.paddingHorizontal) +
        (Number(avatarContainer.padding || 0) || styles.avatarContainer.padding)) *
        2) /
      (avatarSize + (Number(avatarContainer.padding || 0) || styles.avatarContainer.padding) * 2),
  );

  const renderItem = ({ item }: { item: Reaction }) => {
    const { alignment = 'left', name, type } = item;
    const x = avatarSize / 2 - (avatarSize / (radius * 4)) * (alignment === 'left' ? 1 : -1);
    const y = avatarSize - radius;

    const left =
      alignment === 'left'
        ? x -
          (Number(reactionBubbleBackground.width || 0) || styles.reactionBubbleBackground.width) +
          radius
        : x - radius;
    const top =
      y -
      radius -
      (Number(reactionBubbleBackground.height || 0) || styles.reactionBubbleBackground.height);

    return (
      <View style={[styles.avatarContainer, avatarContainer]}>
        <View style={styles.avatarInnerContainer}>
          <OverlayReactionsAvatar reaction={item} size={avatarSize} />
          <View style={[StyleSheet.absoluteFill]}>
            <Svg>
              <Circle
                cx={x - (radius * 2 - radius / 4) * (alignment === 'left' ? 1 : -1)}
                cy={y - radius * 2 - radius / 4}
                fill={alignment === 'left' ? grey_gainsboro : white}
                r={radius * 2}
                stroke={alignment === 'left' ? white : grey_gainsboro}
                strokeWidth={radius / 2}
              />
              <Circle
                cx={x}
                cy={y}
                fill={alignment === 'left' ? grey_gainsboro : white}
                r={radius}
                stroke={alignment === 'left' ? white : grey_gainsboro}
                strokeWidth={radius / 2}
              />
            </Svg>
            <View
              style={[
                styles.reactionBubbleBackground,
                {
                  backgroundColor: alignment === 'left' ? grey_gainsboro : white,
                  borderColor: alignment === 'left' ? white : grey_gainsboro,
                  borderWidth: radius / 2,
                  left,
                  top,
                },
                reactionBubbleBackground,
              ]}
            />
            <View style={[StyleSheet.absoluteFill]}>
              <Svg>
                <Circle
                  cx={x - (radius * 2 - radius / 4) * (alignment === 'left' ? 1 : -1)}
                  cy={y - radius * 2 - radius / 4}
                  fill={alignment === 'left' ? grey_gainsboro : white}
                  r={radius * 2 - radius / 2}
                />
              </Svg>
            </View>
            <View
              style={[
                styles.reactionBubble,
                {
                  backgroundColor: alignment === 'left' ? grey_gainsboro : white,
                  height:
                    (reactionBubbleBorderRadius || styles.reactionBubble.borderRadius) - radius / 2,
                  left,
                  top,
                  width:
                    (reactionBubbleBorderRadius || styles.reactionBubble.borderRadius) - radius / 2,
                },
                reactionBubble,
              ]}
            >
              <ReactionIcon
                pathFill={accent_blue}
                size={(reactionBubbleBorderRadius || styles.reactionBubble.borderRadius) / 2}
                supportedReactions={supportedReactions}
                type={type}
              />
            </View>
          </View>
        </View>
        <View style={styles.avatarNameContainer}>
          <Text numberOfLines={2} style={[styles.avatarName, { color: black }, avatarName]}>
            {name}
          </Text>
        </View>
      </View>
    );
  };

  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: interpolate(showScreen.value, [0, 1], [-layoutHeight.value / 2, 0]),
        },
        {
          translateX: interpolate(
            showScreen.value,
            [0, 1],
            [overlayAlignment === 'left' ? -layoutWidth.value / 2 : layoutWidth.value / 2, 0],
          ),
        },
        {
          scale: showScreen.value,
        },
      ],
    }),
    [overlayAlignment],
  );

  return (
    <>
      <Animated.View
        onLayout={({ nativeEvent: { layout } }) => {
          layoutWidth.value = layout.width;
          layoutHeight.value = layout.height;
        }}
        style={[
          styles.container,
          { backgroundColor: white, opacity: itemHeight ? 1 : 0 },
          container,
          showScreenStyle,
        ]}
      >
        <Text style={[styles.title, { color: black }, titleStyle]}>{title}</Text>
        <FlatList
          contentContainerStyle={styles.flatListContentContainer}
          data={filteredReactions}
          key={numColumns}
          keyExtractor={({ name }, index) => `${name}_${index}`}
          numColumns={numColumns}
          renderItem={renderItem}
          scrollEnabled={filteredReactions.length / numColumns > 1}
          style={[
            styles.flatListContainer,
            flatListContainer,
            {
              // we show the item height plus a little extra to tease for scrolling if there are more than one row
              maxHeight:
                itemHeight + (filteredReactions.length / numColumns > 1 ? itemHeight / 4 : 8),
            },
          ]}
        />
        {/* The below view is unseen by the user, we use it to compute the height that the item must be */}
        <View
          onLayout={({ nativeEvent: { layout } }) => {
            setItemHeight(layout.height);
          }}
          style={[styles.unseenItemContainer, styles.flatListContentContainer]}
        >
          {renderItem({ item: filteredReactions[0] })}
        </View>
      </Animated.View>
    </>
  );
};

OverlayReactions.displayName = 'OverlayReactions{overlay{reactions}}';