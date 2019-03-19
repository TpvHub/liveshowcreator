import React from 'react'
import styled from 'styled-components'
import Slider from "react-slick";
import uuid from "uuid";

import EditIcon from '@material-ui/icons/Edit'
import GfxVideoThumbnail from './gfx-video-thumbnail'
import Image from '../image'

// utils
import {
    isVideo,
    isImageFile
} from "utils/func.util";

// styled-components

const VideoGfxContainer = styled.div`
  width: 100%;
  height: 100%;
`

const SliderContainer = styled.div`
    .thumbnail-slider {
        .slick-prev:before {
            content: '<';
            color: black;
        }
        .slick-next:before, [dir=rtl] .slick-prev:before {
            content: '>';
            color: black;
        }

        .slick-next:before, .slick-prev:before {
            font-size: 20px;
            line-height: 1;
            opacity: 1;
            color: black;
        }
        .slick-next {
            right: -19px;
        }
        .slick-prev {
            left: -19px;
        }

        .slick-slide {
            padding: 0 5px;
        }
        
        .slick-list {
            margin: 0 -5px 0px -5px;
        }
    }
    
    .gfx-asset-count{
      z-index: 1;
      cursor: pointer;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: rgba(0,0,0,0.6);
      color: #FFF;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 10px;
      float: right;
      margin-right: 5px;
   }
`

class ThumbnailSlider extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {
            id,
            thumbnail_setting,
            max_thumbnail_items,
            assets
        } = this.props;
        const assetCount = assets.length;

        return (
            <SliderContainer id={`thumbnail-slider-${id}`}>
                <Slider className={'thumbnail-slider'} {...thumbnail_setting} infinite={assetCount >= max_thumbnail_items} >
                    {
                        assets.map(file => {
                            if (isVideo(file)) {
                                return (
                                    <VideoGfxContainer className="none-out-line-when-focus">
                                        <GfxVideoThumbnail
                                            items={assets}
                                            fileId={file.id}
                                            stylesImage={{
                                                width: "70px", height: "70px"
                                            }}
                                            isOnThumbnailSlider
                                            className="none-out-line-when-focus"
                                        />
                                        {/* <PlayerIcon className={'player-thumbnail'}>
                                    <i className={'md-icon'}>play_arrow</i>
                                  </PlayerIcon> */}
                                    </VideoGfxContainer>
                                )
                            }
                            if (isImageFile(file)) {
                                return (
                                    <div className="gfx-slider-item" key={uuid()}>
                                        <Image
                                            view={true}
                                            items={assets}
                                            fileId={file.id}
                                            className="none-out-line-when-focus"
                                            whereNeedToShowContextMenu='document-sidebar'
                                            stylesImage={{
                                                width: "70px", height: "70px"
                                            }}
                                        />
                                    </div>
                                )
                            }
                            return null;
                        })
                    }
                </Slider>
                <div style={{ textAlign: "right" }}>
                    <span className={'gfx-asset-count'}>
                        {assetCount > 1 ? assetCount : <EditIcon style={{ color: '#FFF', fontSize: '10px' }} />}
                    </span>
                </div>
            </SliderContainer>
        )
    }
}

export default ThumbnailSlider;