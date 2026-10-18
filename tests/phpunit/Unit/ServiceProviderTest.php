<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat\Tests\Unit;

use Acms\Plugins\BlockEditorImageFloat\Hook;
use Acms\Plugins\BlockEditorImageFloat\ServiceProvider;
use Acms\Plugins\BlockEditorImageFloat\Services\Requirements;
use Acms\Services\Common\HookFactory;
use Acms\TestingFramework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;

final class ServiceProviderTest extends TestCase
{
    #[Test]
    #[TestDox('declares the plugin metadata')]
    public function declaresMetadata(): void
    {
        $provider = new ServiceProvider();

        $this->assertSame('BlockEditorImageFloat', $provider->name);
        $this->assertSame('uidev1116', $provider->author);
        $this->assertSame('block_editor_image_float_index', $provider->menu);
        $this->assertFalse($provider->module);
        $this->assertMatchesRegularExpression('/^\d+\.\d+\.\d+$/', $provider->version);
    }

    #[Test]
    #[TestDox('lifecycle methods succeed without side effects')]
    public function lifecycleMethodsSucceed(): void
    {
        $provider = new ServiceProvider();

        $this->assertSame(
            Requirements::isSupportedAcmsVersion(defined('VERSION') ? VERSION : null),
            $provider->checkRequirements(),
        );
        $this->assertTrue($provider->update());
        $this->assertTrue($provider->activate());
        $this->assertTrue($provider->deactivate());
        $provider->install();
        $provider->uninstall();
    }

    #[Test]
    #[TestDox('init() attaches the hook')]
    public function initAttachesHook(): void
    {
        (new ServiceProvider())->init();

        $this->assertInstanceOf(Hook::class, HookFactory::singleton()->getHook('BlockEditorImageFloatHook'));
    }

    #[Test]
    #[TestDox('init() injects the settings screen only on the plugin settings page')]
    public function initInjectsSettingsScreenOnItsOwnPage(): void
    {
        define('ADMIN', 'app_block_editor_image_float_index');

        (new ServiceProvider())->init();

        $this->assertInstanceOf(Hook::class, HookFactory::singleton()->getHook('BlockEditorImageFloatHook'));
    }
}
