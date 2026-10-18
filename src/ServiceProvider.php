<?php

namespace Acms\Plugins\BlockEditorImageFloat;

use ACMS_App;
use Acms\Plugins\BlockEditorImageFloat\Services\Requirements;
use Acms\Services\Common\HookFactory;
use Acms\Services\Common\InjectTemplate;

/**
 * Plugin (extension app) registration class.
 *
 * `src/` is deployed as the plugin root (`extension/plugins/BlockEditorImageFloat/`).
 */
class ServiceProvider extends ACMS_App
{
    /**
     * @var string
     */
    public $version = '0.1.0';

    /**
     * @var string
     */
    public $name = 'BlockEditorImageFloat';

    /**
     * @var string
     */
    public $author = 'uidev1116';

    /**
     * @var bool
     */
    public $module = false;

    /**
     * @var false|string
     */
    public $menu = 'block_editor_image_float_index';

    /**
     * @var string
     */
    public $desc = 'ブロックエディターの画像ブロックにテキスト回り込み（フロート）配置を追加します。';

    /**
     * Boot the plugin (runs on every request while the plugin is active).
     *
     * @return void
     */
    public function init()
    {
        HookFactory::singleton()->attach('BlockEditorImageFloatHook', new Hook());

        // Settings screen: the core's standard config markup (Admin_Config), as in the core and ApiPreview.
        if (defined('ADMIN') && ADMIN === 'app_' . $this->menu) {
            $inject = InjectTemplate::singleton();
            $inject->add('admin-topicpath', PLUGIN_DIR . $this->name . '/template/admin/topicpath.html');
            $inject->add('admin-main', PLUGIN_DIR . $this->name . '/template/admin/main.html');
        }
    }

    /**
     * Environment check before installation.
     *
     * @return bool
     */
    public function checkRequirements()
    {
        return Requirements::isSupportedAcmsVersion(defined('VERSION') ? VERSION : null);
    }

    /**
     * Runs on install (create tables, etc.). This block_editor_image_float uses no tables, so it does nothing.
     *
     * @return void
     */
    public function install()
    {
    }

    /**
     * Runs on uninstall (drop tables, etc.).
     *
     * @return void
     */
    public function uninstall()
    {
    }

    /**
     * Runs on update.
     *
     * @return bool
     */
    public function update()
    {
        return true;
    }

    /**
     * Runs on activate.
     *
     * @return bool
     */
    public function activate()
    {
        return true;
    }

    /**
     * Runs on deactivate.
     *
     * @return bool
     */
    public function deactivate()
    {
        return true;
    }
}
