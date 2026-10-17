<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat;

use Acms\Plugins\BlockEditorImageFloat\Services\AssetRegistrar;

/**
 * Extension points (hooks). Kept thin: the logic lives in Services\AssetRegistrar.
 */
class Hook
{
    /**
     * Register the JS / CSS on admin screens (which include the entry editor).
     *
     * @param string $res The built HTML (unused)
     */
    public function afterBuild(string &$res): void
    {
        (new AssetRegistrar())->register(
            defined('ADMIN') ? ADMIN : null,
            defined('DIR_OFFSET') ? (string) DIR_OFFSET : '',
        );
    }
}
