<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat\Services;

use Acms\Services\Facades\Config;

/**
 * Plugin settings stored in the a-blog cms config (per blog, saved by the settings screen).
 */
final class Settings
{
    /** Config key of the on/off switch ("on" / "off"). */
    public const ENABLED_KEY = 'block_editor_image_float_enabled';

    /**
     * Read the blog-level setting. The settings screen saves to the blog config, which config() does not
     * see when the blog uses a config set, so read the blog config directly (as the ApiPreview plugin does).
     */
    public static function isEnabledForBlog(int $blogId): bool
    {
        $field = Config::loadDefaultField();
        $field->overload(Config::loadBlogConfig($blogId));

        return self::isEnabled($field->get(self::ENABLED_KEY));
    }

    /**
     * The feature is on by default: only an explicit "off" disables it (an unsaved or unexpected value is on).
     *
     * @param mixed $value The saved config value
     */
    public static function isEnabled(mixed $value): bool
    {
        return !(is_string($value) && strtolower(trim($value)) === 'off');
    }
}
