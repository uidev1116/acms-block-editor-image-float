<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat;

use Acms\Plugins\BlockEditorImageFloat\Services\AssetRegistrar;
use Acms\Plugins\BlockEditorImageFloat\Services\Settings;
use Acms\Services\Facades\Entry;

/**
 * Extension points (hooks). Kept thin: the logic lives in Services\AssetRegistrar.
 */
class Hook
{
    /**
     * Register the JS / CSS on admin screens (which include the entry editor) and on public pages
     * while direct edit is enabled (the block editor is mounted there too), unless the feature is
     * switched off in the plugin settings.
     *
     * @param mixed $res The built HTML (unused). Left untyped like the core hook stub.
     */
    public function afterBuild(&$res): void
    {
        (new AssetRegistrar())->register(
            defined('ADMIN') ? ADMIN : null,
            defined('DIR_OFFSET') ? DIR_OFFSET : '',
            Entry::isDirectEditEnabled(),
            Settings::isEnabledForBlog(defined('BID') ? BID : 1),
        );
    }
}
