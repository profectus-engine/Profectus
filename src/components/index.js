// Import and register all components,
// which will allow us to use them in any template strings anywhere in the project

import Vue from 'vue';

/* features */
import Achievement from './features/Achievement';
import Achievements from './features/Achievements';
import Bar from './features/Bar';
import Buyable from './features/Buyable';
import Buyables from './features/Buyables';
import Challenge from './features/Challenge';
import Challenges from './features/Challenges';
import Clickable from './features/Clickable';
import Clickables from './features/Clickables';
import DefaultChallengeDisplay from './features/DefaultChallengeDisplay';
import DefaultPrestigeButtonDisplay from './features/DefaultPrestigeButtonDisplay';
import DefaultUpgradeDisplay from './features/DefaultUpgradeDisplay';
import Grid from './features/Grid';
import Gridable from './features/Gridable';
import Infobox from './features/Infobox';
import MainDisplay from './features/MainDisplay';
import MarkNode from './features/MarkNode';
import MasterButton from './features/MasterButton';
import Milestone from './features/Milestone';
import Milestones from './features/Milestones';
import PrestigeButton from './features/PrestigeButton';
import ResourceDisplay from './features/ResourceDisplay';
import RespecButton from './features/RespecButton';
import Upgrade from './features/Upgrade';
import Upgrades from './features/Upgrades';
/* fields */
import Select from './fields/Select';
import Slider from './fields/Slider';
import Text from './fields/Text';
import Toggle from './fields/Toggle';
/* system */
import Column from './system/Column';
import DefaultLayerTab from './system/DefaultLayerTab';
import GameOverScreen from './system/GameOverScreen';
import Info from './system/Info';
import LayerProvider from './system/LayerProvider';
import LayerTab from './system/LayerTab';
import Microtab from './system/Microtab';
import Modal from './system/Modal';
import NaNScreen from './system/NaNScreen';
import Nav from './system/Nav';
import Options from './system/Options';
import Resource from './system/Resource';
import Row from './system/Row';
import Spacer from './system/Spacer';
import Sticky from './system/Sticky';
import Subtab from './system/Subtab';
import TabButton from './system/TabButton';
import Tabs from './system/Tabs';
import Tooltip from './system/Tooltip';
import TPS from './system/TPS';
import VerticalRule from './system/VerticalRule';
/* tree */
import Branches from './tree/Branches';
import BranchLine from './tree/BranchLine';
import BranchNode from './tree/BranchNode';
import Tree from './tree/Tree';
import TreeNode from './tree/TreeNode';
/* misc */
import frag from 'vue-frag';
import TransitionExpand from 'vue-transition-expand';
import 'vue-transition-expand/dist/vue-transition-expand.css';
import PerfectScrollbar from 'vue2-perfect-scrollbar';
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css';
import VueTextareaAutosize from 'vue-textarea-autosize';
import PortalVue from 'portal-vue';

/* features */
Vue.component(Achievement.name, Achievement);
Vue.component(Achievements.name, Achievements);
Vue.component(Bar.name, Bar);
Vue.component(Buyable.name, Buyable);
Vue.component(Buyables.name, Buyables);
Vue.component(Challenge.name, Challenge);
Vue.component(Challenges.name, Challenges);
Vue.component(Clickable.name, Clickable);
Vue.component(Clickables.name, Clickables);
Vue.component(DefaultChallengeDisplay.name, DefaultChallengeDisplay);
Vue.component(DefaultPrestigeButtonDisplay.name, DefaultPrestigeButtonDisplay);
Vue.component(DefaultUpgradeDisplay.name, DefaultUpgradeDisplay);
Vue.component(Grid.name, Grid);
Vue.component(Gridable.name, Gridable);
Vue.component(Infobox.name, Infobox);
Vue.component(MainDisplay.name, MainDisplay);
Vue.component(MarkNode.name, MarkNode);
Vue.component(MasterButton.name, MasterButton);
Vue.component(Milestone.name, Milestone);
Vue.component(Milestones.name, Milestones);
Vue.component(PrestigeButton.name, PrestigeButton);
Vue.component(ResourceDisplay.name, ResourceDisplay);
Vue.component(RespecButton.name, RespecButton);
Vue.component(Upgrade.name, Upgrade);
Vue.component(Upgrades.name, Upgrades);
/* fields */
Vue.component(Select.name, Select);
Vue.component(Slider.name, Slider);
Vue.component(Text.name, Text);
Vue.component(Toggle.name, Toggle);
/* system */
Vue.component(Column.name, Column);
Vue.component(DefaultLayerTab.name, DefaultLayerTab);
Vue.component(GameOverScreen.name, GameOverScreen);
Vue.component(Info.name, Info);
Vue.component(LayerProvider.name, LayerProvider);
Vue.component(LayerTab.name, LayerTab);
Vue.component(Microtab.name, Microtab);
Vue.component(Modal.name, Modal);
Vue.component(NaNScreen.name, NaNScreen);
Vue.component(Nav.name, Nav);
Vue.component(Options.name, Options);
Vue.component(Resource.name, Resource);
Vue.component(Row.name, Row);
Vue.component(Spacer.name, Spacer);
Vue.component(Sticky.name, Sticky);
Vue.component(Subtab.name, Subtab);
Vue.component(TabButton.name, TabButton);
Vue.component(Tabs.name, Tabs);
Vue.component(Tooltip.name, Tooltip);
Vue.component(TPS.name, TPS);
Vue.component(VerticalRule.name, VerticalRule);
/* tree */
Vue.component(Branches.name, Branches);
Vue.component(BranchLine.name, BranchLine);
Vue.component(BranchNode.name, BranchNode);
Vue.component(Tree.name, Tree);
Vue.component(TreeNode.name, TreeNode);
/* misc */
Vue.directive('frag', frag);
Vue.use(TransitionExpand);
Vue.use(PerfectScrollbar);
Vue.use(VueTextareaAutosize);
Vue.use(PortalVue);
