import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import { initCloudSync } from "./utils/sync";

export function createApp() {
	const app = createSSRApp(App);
	// 启动时尝试云端同步（失败自动降级为本地模式）
	initCloudSync();
	return {
		app,
	};
}
