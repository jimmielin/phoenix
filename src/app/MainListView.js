import React, {useState, useRef} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Badge, Tooltip, message, Modal} from 'antd';
import copy from 'copy-to-clipboard';

import {TaskView} from './TaskView';
import {SideHeaderLayout} from '../widgets/Layout';
import {PoppableText} from '../widgets/PoppableText';
import {ClickableText} from '../widgets/ClickableText';
import {MainListSortable} from '../widgets/MainListSortable';
import {IconForColorType} from '../widgets/IconForColorType';

import {scope_name, next_scope, colortype, dflt} from '../functions';
import {show_modal, do_update_completeness} from '../state/actions';

import './MainListView.less';
import {
    PlusOutlined,
    AppstoreOutlined,
    ShareAltOutlined,
    DoubleRightOutlined,
    EditOutlined,
    GiftOutlined,
    WifiOutlined,
    VerticalAlignMiddleOutlined,
    DragOutlined,
    StopOutlined,
    MoreOutlined
} from '@ant-design/icons';

function SectionHeader(props) {
    const dispatch=useDispatch();

    let cs=props.scope;
    let ns=next_scope(cs);
    let csname=scope_name(props.scope);
    let nsname=scope_name(ns);

    let active_subtasks=useSelector((state)=>(
        props.scope!=='project' ? [] : props.item.task_order
            .map((tid)=>state.task[tid])
            .filter((task)=>task.status==='active' && task.completeness==='todo')
    ));

    let menu=[
        ...(props.item.external ? [] : [
            {
                children: (<span><PlusOutlined /> 新建子{nsname}</span>),
                onClick: ()=>dispatch(show_modal('add',ns,props.id)),
            },
            {
                children: (<span><AppstoreOutlined /> 整理{nsname}</span>),
                onClick: ()=>dispatch(show_modal('reorder',ns,props.id)),
                _key: 'reorder',
            },
        ]),
        ...((cs!=='project' || !props.item.share_hash) ? [] : [
            {
                children: (<span><ShareAltOutlined /> 复制分享 ID</span>),
                onClick: ()=>{
                    if(copy(props.item.name.replace(/\n/,' ')+'@@'+props.item.share_hash))
                        message.success('已复制',2);
                },
            }
        ]),
        ...(!active_subtasks.length ? [] : [
            {
                children: (<span><DoubleRightOutlined /> 完成所有待办任务</span>),
                onClick: ()=>{
                    Modal.confirm({
                        icon: (<DoubleRightOutlined />),
                        title: `将 ${active_subtasks.length} 个待办任务标为完成`,
                        content: (
                            <ul>
                                {active_subtasks.map((task)=>(
                                    <li key={task.id}>
                                        {task.name}
                                    </li>
                                ))}
                            </ul>
                        ),
                        okText: (<span>确定<span style={{display: 'none'}}>.</span></span>), // https://github.com/ant-design/ant-design/issues/21692
                        cancelText: (<span>取消<span style={{display: 'none'}}>.</span></span>),
                        onOk() {
                            dispatch(do_update_completeness(active_subtasks.map((task)=>task.id),'done'));
                        },
                        onCancel() {},
                    });
                },
            }
        ]),
        {
            children: (<span><EditOutlined /> 编辑{csname} “{props.item.name}”</span>),
            onClick: ()=>dispatch(show_modal('update',cs,props.id)),
        },
    ];
    if(props.item[ns+'_order'].length===0) // empty
        menu=menu.filter((menuitem)=>menuitem._key!=='reorder'); // remove reorder

    return (
        <PoppableText menu={menu} className={'section-header-'+props.scope}>
            <span className={'reorder-handle reorder-handle-'+props.scope}><MoreOutlined /> </span>{props.item.name}
            {props.item.external &&
                <Tooltip title="来自其他用户的分享" className="project-icon-shared">
                    &nbsp;<GiftOutlined />
                </Tooltip>
            }
            {!!props.item.share_hash &&
                <Tooltip title="分享给其他用户" className="project-icon-sharing">
                    &nbsp;<WifiOutlined />
                </Tooltip>
            }
        </PoppableText>
    );
}

function ProjectView(props) {
    const dispatch=useDispatch();
    const project=useSelector((state)=>state.project[props.pid]);
    const tasks=useSelector((state)=>state.task);
    const settings=useSelector((state) => state.user.settings);

    const [expanded,set_expanded]=useState(false);
    const refresh_key=useSelector((state)=>state.local.refresh_key)+(expanded?1:0);

    let task_collapse_badge_style={
        className: "task-collapse-badge",
        style: {backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset'},
        offset: [2,-3],
    };

    let sticky_task=useRef({map: {}, key: refresh_key});
    if(sticky_task.current.key!==refresh_key) {
        sticky_task.current.map={};
        sticky_task.current.key=refresh_key;
    }

    let cnt={done: 0, ignored: 0};
    let tasks_to_display;

    if(expanded) {
        tasks_to_display=project.task_order;
    } else {
        if(dflt(settings.collapse_all_past,false)) { // hide all
            tasks_to_display=project.task_order.filter((tid)=>{
                let ctype=colortype(tasks[tid]);
                let should_show=sticky_task.current.map[tid] || !(ctype==='done' || ctype==='ignored');

                if(should_show)
                    sticky_task.current.map[tid]=true;
                else
                    cnt[ctype]++;

                return should_show;
            });
        } else { // hide prefix
            let task_start_idx=0;
            for(;task_start_idx<project.task_order.length;task_start_idx++) {
                let tid=project.task_order[task_start_idx];
                let ctype=colortype(tasks[tid]);
                let should_show=sticky_task.current.map[tid] || !(ctype==='done' || ctype==='ignored');

                if(should_show)
                    break;
                else
                    cnt[ctype]++;
            }
            if(task_start_idx) {
                task_start_idx--;
                cnt[colortype(tasks[project.task_order[task_start_idx]])]--;
            }
            tasks_to_display=project.task_order.filter((tid,idx)=>{
                if(idx>task_start_idx)
                    sticky_task.current.map[tid]=true;

                return idx>=task_start_idx;
            });
        }
    }

    return (
        <SideHeaderLayout header={<SectionHeader scope="project" id={props.pid} item={project} />} headerClassName="project-header-container">
            <div className={expanded ? 'task-list-expanded width-container-rightonly' : 'task-list-collapsed width-container-rightonly-padded'}>
                {expanded ?
                    <ClickableText onClick={()=>set_expanded(false)} className="have-hover-bg task-collapse-widget">
                        <VerticalAlignMiddleOutlined /> <span className="task-collapse-label">收起</span>
                    </ClickableText> :
                    <ClickableText onClick={()=>set_expanded(true)} className="have-hover-bg task-collapse-widget">
                        <DragOutlined />
                        {cnt.done>0 &&
                            <Badge count={cnt.done} {...task_collapse_badge_style} title={'已完成'+cnt.done+'项'}>
                                <IconForColorType type="done" />
                            </Badge>
                        }
                        {cnt.ignored>0 &&
                            <Badge count={cnt.ignored} {...task_collapse_badge_style}  title={'忽略'+cnt.done+'项'}>
                                <StopOutlined />
                            </Badge>
                        }
                    </ClickableText>
                }
                <MainListSortable
                    scope="task" id={props.pid} subs={tasks_to_display}
                    key={expanded} // https://github.com/SortableJS/react-sortablejs/issues/118
                    underlying={{
                        tag: "span",
                        direction: 'horizontal',
                        disabled: !expanded,
                    }}
                >
                    {tasks_to_display.map((tid)=>(
                        <TaskView key={tid} tid={tid} external={project.external} can_sort={expanded && !project.external} />
                    ))}
                </MainListSortable>
                {tasks_to_display.length===0 &&
                    <span className="task-empty-label">
                        无待办任务 &nbsp;
                    </span>
                }
                <ClickableText onClick={()=>dispatch(show_modal('add','task',props.pid))}>
                    <PlusOutlined />
                </ClickableText>
            </div>
            <div className="project-margin" />
        </SideHeaderLayout>
    );
}

function ZoneView(props) {
    const dispatch=useDispatch();
    const zone=useSelector((state)=>state.zone[props.zid]);

    return (
        <div>
            <SideHeaderLayout headerClassName="zone-header-container" header={<SectionHeader scope="zone" id={props.zid} item={zone} />}>
                <MainListSortable scope="project" id={props.zid} subs={zone.project_order}>
                    {zone.project_order.map((pid)=>(
                        <ProjectView key={pid} pid={pid} />
                    ))}
                </MainListSortable>
                {zone.project_order.length===0 &&
                    <div className="project-header-container">
                        <ClickableText onClick={()=>dispatch(show_modal('add','project',props.zid))} className="section-header-project">
                            <PlusOutlined /> 新建类别
                        </ClickableText>
                    </div>
                }
            </SideHeaderLayout>
            <div className="zone-margin" />
        </div>
    );
}

export function MainListView(props) {
    const dispatch=useDispatch();
    const zone_order=useSelector((state)=>state.zone_order);

    return (
        <div>
            <div className="xl-only legend">
                <SideHeaderLayout header={<span>课程</span>}>
                    <SideHeaderLayout header={<span>类别</span>}>
                        <span>任务</span>
                    </SideHeaderLayout>
                </SideHeaderLayout>
                <div className="project-margin" />
            </div>
            <MainListSortable scope="zone" id={null} subs={zone_order}>
                {zone_order.map((zid)=>(
                    <ZoneView key={zid} zid={zid} />
                ))}
            </MainListSortable>
            <div className="zone-header-container">
                <ClickableText onClick={()=>dispatch(show_modal('add','zone',null))} className="section-header-zone">
                    <PlusOutlined /> 新建课程
                </ClickableText>
            </div>
        </div>
    );
}