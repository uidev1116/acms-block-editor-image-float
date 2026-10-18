<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat\Services;

/**
 * Environment requirements of the plugin.
 */
final class Requirements
{
    /** The minimum a-blog cms version (the plugin extension platform, ACMS.plugins, is required). */
    public const MIN_ACMS_VERSION = '3.2.36';

    /**
     * @param mixed $version The running a-blog cms version (the core VERSION constant)
     */
    public static function isSupportedAcmsVersion(mixed $version): bool
    {
        return is_string($version) && $version !== '' && version_compare($version, self::MIN_ACMS_VERSION, '>=');
    }
}
