import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Menu, Dropdown} from 'antd';

import {PoppableText} from '../widgets/PoppableText';
import {ClickableText} from '../widgets/ClickableText';
import {TimeStr} from '../widgets/TimeStr';

import {show_modal, do_refresh, get_token, do_reset_splash_index} from '../state/actions';

import './AppHeader.less';
import fire_bird_logo from '../fire_bird_bw.png';
import {SettingOutlined, UserOutlined, PlusOutlined, AppstoreOutlined, MoreOutlined, LoadingOutlined, SyncOutlined, ExclamationCircleOutlined, LogoutOutlined, UndoOutlined} from '@ant-design/icons';

export function AppHeader(props) {
    const dispatch=useDispatch();

    const loading=useSelector((state)=>state.local.loading);
    const user=useSelector((state)=>state.user);

    return (
        <div className="header-row">
            <div className="width-container">
                {!!user &&
                    <div className="pull-right">
                        <Dropdown trigger={['click']} overlay={<Menu>
                            <Menu.Item disabled={true}>
                                当前用户：{user.name}
                            </Menu.Item>
                            <Menu.Item disabled={true}>
                                用户组：Ring {user.ring}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item>
                                <a onClick={()=>dispatch(show_modal('settings',null,null))}>
                                    <SettingOutlined /> 设置
                                </a>
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item>
                                <a onClick={()=>dispatch(do_reset_splash_index())}>
                                    <UndoOutlined /> 重新显示欢迎页面
                                </a>
                            </Menu.Item>
                            <Menu.Item>
                                <a onClick={()=>{
                                    if(window.confirm('将会注销网页版 PKU Helper')) {
                                        delete localStorage['TOKEN'];
                                        dispatch(get_token());
                                    }
                                }}>
                                    <LogoutOutlined /> 注销 PKU Helper
                                </a>
                            </Menu.Item>
                        </Menu>}>
                            <ClickableText>
                                &nbsp; <UserOutlined /> &nbsp;
                            </ClickableText>
                        </Dropdown>
                    </div>
                }
                <PoppableText menu={[
                    {
                        children: (<span><PlusOutlined /> 新建课程</span>),
                        onClick: ()=>dispatch(show_modal('add','zone',null)),
                    },
                    {
                        children: (<span><AppstoreOutlined /> 整理课程</span>),
                        onClick: ()=>dispatch(show_modal('reorder','zone',null)),
                    },
                ]}>
                    <img src={fire_bird_logo} className="header-logo-img" alt="fire bird logo" title="美术协力 @Meguchi" />
                    <MoreOutlined />
                    <span className="l-only"> 不咕计划</span>
                </PoppableText>
                &nbsp;&nbsp;
                <ClickableText key={+loading.last_update_time} onClick={()=>dispatch(do_refresh())}>
                    {{
                        loading: <LoadingOutlined />,
                        done: <SyncOutlined className="header-refresh-icon" />,
                        error: <ExclamationCircleOutlined className="header-refresh-icon" />,
                    }[loading.status]}
                    &nbsp;
                    {loading.status==='loading' ? '正在更新' :
                        <span>
                            <TimeStr time={loading.last_update_time} />
                            &nbsp;更新
                        </span>
                    }
                </ClickableText>
            </div>
        </div>
    );
}