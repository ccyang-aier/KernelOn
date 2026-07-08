import { useControls, folder, Leva } from 'leva';
import { isChineseLanguage, isUzbekLanguage } from './utils';
import { LevaVectorNew } from './controls/LevaVectorNew/LevaVectorNew';
import { LevaContainer } from './controls/LevaContainer/LevaContainer';
import { LevaCheckButtons } from './controls/LevaCheckButtons';
import { useLayoutEffect, useMemo, useState } from 'react';
import languages from './utils/languages';
import { liquidGlassStudioDefaultControls } from './defaultControls';

export const useLevaControls = ({
  containerRender,
  rendererOptions,
}: {
  containerRender: {
    bgType: (props: { value: number; setValue: (v: number) => void }) => React.ReactNode;
  };
  rendererOptions?: {
    webgpuSupported: boolean;
    webgpuUnavailableReason?: string;
    onRendererChange?: (backend: 'webgl' | 'webgpu') => void;
  };
}) => {
  const [langName, setLangName] = useState<keyof typeof languages>(
    isChineseLanguage() ? 'zh-CN' : isUzbekLanguage() ? 'uz-UZ' : 'en-US',
  );
  const lang = useMemo(() => {
    return languages[langName];
  }, [langName]);

  const [controls, controlsAPI] = useControls(
    () => ({
      ['basicSettings']: folder({
        renderer: LevaCheckButtons({
          label: lang['editor.renderer'],
          selected: ['webgl'],
          options: [
            { value: 'webgl', label: 'WebGL' },
            {
              value: 'webgpu',
              label: 'WebGPU',
              disabled: !rendererOptions?.webgpuSupported,
              title: !rendererOptions?.webgpuSupported
                ? (rendererOptions?.webgpuUnavailableReason || lang['editor.rendererWebGPUUnavailable'])
                : undefined,
            },
          ],
          singleMode: true,
          onClick: (v) => {
            rendererOptions?.onRendererChange?.(v[0] as 'webgl' | 'webgpu');
          },
        }),
        language: LevaCheckButtons({
          label: lang['editor.language'],
          selected: [langName],
          options: !isChineseLanguage()
            ? [
              { value: 'en-US', label: 'English' },
              { value: 'zh-CN', label: '简体中文' },
              { value: 'uz-UZ', label: "O'zbekcha" },
            ]
            : [
              { value: 'zh-CN', label: '简体中文' },
              { value: 'en-US', label: 'English' },
              { value: 'uz-UZ', label: "O'zbekcha" },
            ],
          onClick: (v) => {
            setLangName((v as (keyof typeof languages)[])[0]);
          },
          singleMode: true,
        }),
      }),
      refThickness: {
        label: lang['editor.refThickness'],
        min: 1,
        max: 80,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.refThickness,
      },
      refFactor: {
        label: lang['editor.refFactor'],
        min: 1,
        max: 4,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.refFactor,
      },
      refDispersion: {
        label: lang['editor.refDispersion'],
        min: 0,
        max: 50,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.refDispersion,
      },
      refFresnelRange: {
        label: lang['editor.refFresnelRange'],
        min: 0,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.refFresnelRange,
      },
      refFresnelHardness: {
        label: lang['editor.refFresnelHardness'],
        min: 0,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.refFresnelHardness,
      },
      refFresnelFactor: {
        label: lang['editor.refFresnelFactor'],
        min: 0,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.refFresnelFactor,
      },
      glareRange: {
        label: lang['editor.glareRange'],
        min: 0,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.glareRange,
      },
      glareHardness: {
        label: lang['editor.glareHardness'],
        min: 0,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.glareHardness,
      },
      glareFactor: {
        label: lang['editor.glareFactor'],
        min: 0,
        max: 120,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.glareFactor,
      },
      glareConvergence: {
        label: lang['editor.glareConvergence'],
        min: 0,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.glareConvergence,
      },
      glareOppositeFactor: {
        label: lang['editor.glareOppositeFactor'],
        min: 0,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.glareOppositeFactor,
      },
      glareAngle: {
        label: lang['editor.glareAngle'],
        min: -180,
        max: 180,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.glareAngle,
      },
      blurRadius: {
        label: lang['editor.blurRadius'],
        min: 1,
        max: 200,
        step: 1,
        value: liquidGlassStudioDefaultControls.blurRadius,
      },
      blurEdge: {
        label: lang['editor.blurEdge'],
        value: liquidGlassStudioDefaultControls.blurEdge,
      },
      tint: {
        label: lang['editor.tint'],
        value: liquidGlassStudioDefaultControls.tint,
      },
      shadowExpand: {
        label: lang['editor.shadowExpand'],
        min: 2,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.shadowExpand,
      },
      shadowFactor: {
        label: lang['editor.shadowFactor'],
        min: 0,
        max: 100,
        step: 0.01,
        value: liquidGlassStudioDefaultControls.shadowFactor,
      },
      shadowPosition: LevaVectorNew({
        label: lang['editor.shadowPosition'],
        x: liquidGlassStudioDefaultControls.shadowPosition.x,
        y: liquidGlassStudioDefaultControls.shadowPosition.y,
        xMax: 20,
        yMax: 20,
      }),
      bgType: LevaContainer({
        label: lang['editor.bgType'],
        contentValue: 0,
        content: containerRender.bgType,
      }),
      ['shapeSettings']: folder({
        shapeWidth: {
          label: lang['editor.shapeWidth'],
          min: 20,
          max: 800,
          step: 1,
          value: liquidGlassStudioDefaultControls.shapeWidth,
        },
        shapeHeight: {
          label: lang['editor.shapeHeight'],
          min: 20,
          max: 800,
          step: 1,
          value: liquidGlassStudioDefaultControls.shapeHeight,
        },
        shapeRadius: {
          label: lang['editor.shapeRadius'],
          min: 1,
          max: 100,
          step: 0.1,
          value: liquidGlassStudioDefaultControls.shapeRadius,
        },
        shapeRoundness: {
          label: lang['editor.shapeRoundness'],
          min: 2,
          max: 7,
          step: 0.01,
          value: liquidGlassStudioDefaultControls.shapeRoundness,
        },
        mergeRate: {
          label: lang['editor.mergeRate'],
          min: 0,
          max: 0.3,
          step: 0.01,
          value: liquidGlassStudioDefaultControls.mergeRate,
        },
        showShape1: {
          label: lang['editor.showShape1'],
          value: liquidGlassStudioDefaultControls.showShape1,
        },
      }),
      animationSettings: folder({
        springSizeFactor: {
          label: lang['editor.springSizeFactor'],
          min: 0,
          max: 50,
          step: 0.01,
          value: 10,
        },
      }, {
        collapsed: true
      }),
      ['debugSettings']: folder({
        step: {
          label: 'Show Step',
          value: liquidGlassStudioDefaultControls.step,
          min: 0,
          max: 9,
          step: 1,
        },
      }, {
        collapsed: true
      }),
    }),
    [langName, rendererOptions?.webgpuSupported],
  );

  useLayoutEffect(() => {
    const levaRoot = document.querySelector('#root>[class^=leva]');
    if (!levaRoot) {
      return;
    }

    setTimeout(() => {
      const controlEls = (levaRoot.lastChild as HTMLDivElement).querySelectorAll('&>div>div');
      controlEls.forEach((el) => {
        const ctrlEl = el as HTMLDivElement;
        const styleStr = ctrlEl.getAttribute('style');
        if (styleStr && styleStr.includes('folder')) {
          // get title str:
          const titleEl = ctrlEl.querySelector('&>div>svg+div') as HTMLDivElement;
          if (!titleEl) {
            return;
          }
          const titleStr = titleEl.innerText;
          ctrlEl.style.setProperty(
            '--i18n-name',
            `"${lang[`editor.${titleStr}` as keyof Omit<typeof lang, '_settings'>] ?? titleStr}"`,
          );
          ctrlEl.dataset.levaFolder = '1';
        }
      });
    }, 0);
  }, [lang]);

  const levaGlobal = (
    <Leva
      theme={{
        sizes: {
          rootWidth: lang['_settings'].rootWidth,
          numberInputMinWidth: lang['_settings'].numberInputMinWidth,
          controlWidth: lang['_settings'].controlWidth,
        },
        space: {
          colGap: '5px',
        },
      }}
    ></Leva>
  );

  return {
    controls,
    controlsAPI,
    lang,
    langName,
    levaGlobal,
  };
};
