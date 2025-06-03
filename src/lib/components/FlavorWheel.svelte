<script lang="ts">
    import { onMount } from 'svelte';
    import * as echarts from 'echarts';
    import type { EChartsOption, ECElementEvent } from 'echarts';

    export let onFlavorSelect: (flavor: string) => void;
    
    let chartContainer: HTMLElement;
    let chart: echarts.ECharts;

    // The exact data structure from the Apache ECharts example
    const data = [
      {
        name: 'Floral',
        itemStyle: {
          color: '#da0d68'
        },
        children: [
        {
            name: 'Black Tea',
            value: 1,
            itemStyle: {
            color: '#975e6d'
            }
        },
        {
            name: 'Green Tea',
            value: 1,
            itemStyle: {
            color: '#448033'
            }
        },
            {
            name: 'Chamomile',
            value: 1,
            itemStyle: {
                color: '#f99e1c'
            }
            },
            {
            name: 'Rose',
            value: 1,
            itemStyle: {
                color: '#ef5a78'
            }
            },
            {
            name: 'Jasmine',
            value: 1,
            itemStyle: {
                color: '#f7f1bd'
            }
            }
            ]
      },
      {
        name: 'Fruity',
        itemStyle: {
          color: '#da1d23'
        },
        children: [
          {
            name: 'Berry',
            itemStyle: {
              color: '#dd4c51'
            },
            children: [
              {
                name: 'Blackberry',
                value: 1,
                itemStyle: {
                  color: '#3e0317'
                }
              },
              {
                name: 'Raspberry',
                value: 1,
                itemStyle: {
                  color: '#e62969'
                }
              },
              {
                name: 'Blueberry',
                value: 1,
                itemStyle: {
                  color: '#6569b0'
                }
              },
              {
                name: 'Strawberry',
                value: 1,
                itemStyle: {
                  color: '#ef2d36'
                }
              }
            ]
          },
          {
            name: 'Dried Fruit',
            itemStyle: {
              color: '#c94a44'
            },
            children: [
              {
                name: 'Raisin',
                value: 1,
                itemStyle: {
                  color: '#b53b54'
                }
              },
              {
                name: 'Prune',
                value: 1,
                itemStyle: {
                  color: '#a5446f'
                }
              }
            ]
          },
          {
            name: 'Other Fruit',
            itemStyle: {
              color: '#dd4c51'
            },
            children: [
              {
                name: 'Coconut',
                value: 1,
                itemStyle: {
                  color: '#f2684b'
                }
              },
              {
                name: 'Cherry',
                value: 1,
                itemStyle: {
                  color: '#e73451'
                }
              },
              {
                name: 'Lychee',
                value: 1,
                itemStyle: {
                  color: '#e6e6c9'
                }
              },
              {
                name: 'Pineapple',
                value: 1,
                itemStyle: {
                  color: '#f89a1c'
                }
              },
              {
                name: 'Grape',
                value: 1,
                itemStyle: {
                  color: '#aeb92c'
                }
              },
              {
                name: 'Apple',
                value: 1,
                itemStyle: {
                  color: '#4eb849'
                }
              },
              {
                name: 'Peach',
                value: 1,
                itemStyle: {
                  color: '#f68a5c'
                }
              }
            ]
          },
          {
            name: 'Citrus Fruit',
            itemStyle: {
              color: '#f7a128'
            },
            children: [
              {
                name: 'Grapefruit',
                value: 1,
                itemStyle: {
                  color: '#f26355'
                }
              },
              {
                name: 'Orange',
                value: 1,
                itemStyle: {
                  color: '#e2631e'
                }
              },
              {
                name: 'Lemon',
                value: 1,
                itemStyle: {
                  color: '#fde404'
                }
              },
              {
                name: 'Lime',
                value: 1,
                itemStyle: {
                  color: '#7eb138'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Sour',
        itemStyle: {
          color: '#ebb40f'
        },
        children: [
              {
                name: 'Vinegar',
                value: 1,
                itemStyle: {
                  color: '#94a76f'
                }
              },
              {
                name: 'Citrus Sour',
                value: 1,
                itemStyle: {
                  color: '#faef07'
                }
              },
              {
                name: 'Cider',
                value: 1,
                itemStyle: {
                  color: '#c1ba07'
                }
              }
            ]
          },
          {
            name: 'Fermented',
            itemStyle: {
              color: '#b09733'
            },
            children: [
              {
                name: 'Winey',
                value: 1,
                itemStyle: {
                  color: '#8f1c53'
                }
              },
              {
                name: 'Whiskey',
                value: 1,
                itemStyle: {
                  color: '#b34039'
                }
              },
              {
                name: 'Beer',
                value: 1,
                itemStyle: {
                  color: '#ba9232'
                }
              },
              {
                name: 'Overripe',
                value: 1,
                itemStyle: {
                  color: '#8b6439'
                }
              }
            ]
          },
      {
        name: 'Vegetative',
        itemStyle: {
          color: '#187a2f'
        },
        children: [
          {
            name: 'Green',
            itemStyle: {
              color: '#3aa255'
            },
            children: [
              {
                name: 'Under-ripe',
                value: 1,
                itemStyle: {
                  color: '#a2bb2b'
                }
              },
              {
                name: 'Dried Hay',
                value: 1,
                itemStyle: {
                  color: '#62aa3c'
                }
              },
              {
                name: 'Fresh',
                value: 1,
                itemStyle: {
                  color: '#03a653'
                }
              },
              {
                name: 'Dark Green',
                value: 1,
                itemStyle: {
                  color: '#038549'
                }
              },
              {
                name: 'Vegetative',
                value: 1,
                itemStyle: {
                  color: '#28b44b'
                }
              },
              {
                name: 'Grassy',
                value: 1,
                itemStyle: {
                  color: '#a3a830'
                }
              },
              {
                name: 'Herbal',
                value: 1,
                itemStyle: {
                  color: '#7ac141'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Other',
        itemStyle: {
          color: '#0aa3b5'
        },
        children: [
          {
            name: 'Papery/Musty',
            itemStyle: {
              color: '#9db2b7'
            },
            children: [
              {
                name: 'Stale',
                value: 1,
                itemStyle: {
                  color: '#8b8c90'
                }
              },
              {
                name: 'Cardboard',
                value: 1,
                itemStyle: {
                  color: '#beb276'
                }
              },
              {
                name: 'Papery',
                value: 1,
                itemStyle: {
                  color: '#fefef4'
                }
              },
              {
                name: 'Woody',
                value: 1,
                itemStyle: {
                  color: '#744e03'
                }
              },
              {
                name: 'Moldy/Damp',
                value: 1,
                itemStyle: {
                  color: '#a3a36f'
                }
              },
              {
                name: 'Musty/Earthy',
                value: 1,
                itemStyle: {
                  color: '#978847'
                }
              }
            ]
          },
          {
            name: 'Chemical',
            itemStyle: {
              color: '#76c0cb'
            },
            children: [
              {
                name: 'Bitter',
                value: 1,
                itemStyle: {
                  color: '#80a89d'
                }
              },
              {
                name: 'Medicinal',
                value: 1,
                itemStyle: {
                  color: '#7a9bae'
                }
              },
              {
                name: 'Petroleum',
                value: 1,
                itemStyle: {
                  color: '#039fb8'
                }
              },
              {
                name: 'Skunky',
                value: 1,
                itemStyle: {
                  color: '#5e777b'
                }
              },
              {
                name: 'Rubber',
                value: 1,
                itemStyle: {
                  color: '#120c0c'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Roasted',
        itemStyle: {
          color: '#c94930'
        },
        children: [
          {
            name: 'Tobacco',
            value: 1,
            itemStyle: {
              color: '#dfbd7e'
            }
          },
          {
            name: 'Burnt',
            itemStyle: {
              color: '#be8663'
            },
            children: [
              {
                name: 'Acrid',
                value: 1,
                itemStyle: {
                  color: '#b9a449'
                }
              },
              {
                name: 'Ashy',
                value: 1,
                itemStyle: {
                  color: '#899893'
                }
              },
              {
                name: 'Smoky',
                value: 1,
                itemStyle: {
                  color: '#a1743b'
                }
              }
            ]
          },
          {
            name: 'Cereal',
            itemStyle: {
              color: '#ddaf61'
            },
            children: [
              {
                name: 'Grain',
                value: 1,
                itemStyle: {
                  color: '#b7906f'
                }
              },
              {
                name: 'Malt',
                value: 1,
                itemStyle: {
                  color: '#eb9d5f'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Spices',
        itemStyle: {
          color: '#ad213e'
        },
        children: [
          {
            name: 'Pepper',
            value: 1,
            itemStyle: {
              color: '#cc3d41'
            }
          },
          {
            name: 'Brown Spice',
            itemStyle: {
              color: '#b14d57'
            },
            children: [
              {
                name: 'Anise',
                value: 1,
                itemStyle: {
                  color: '#c78936'
                }
              },
              {
                name: 'Nutmeg',
                value: 1,
                itemStyle: {
                  color: '#8c292c'
                }
              },
              {
                name: 'Cinnamon',
                value: 1,
                itemStyle: {
                  color: '#e5762e'
                }
              },
              {
                name: 'Clove',
                value: 1,
                itemStyle: {
                  color: '#a16c5a'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Nutty/\nCocoa',
        itemStyle: {
          color: '#a87b64'
        },
        children: [
          {
            name: 'Nutty',
            itemStyle: {
              color: '#c78869'
            },
            children: [
              {
                name: 'Pecan',
                value: 1,
                itemStyle: {
                  color: '#d4ad12'
                }
              },
              {
                name: 'Hazelnut',
                value: 1,
                itemStyle: {
                  color: '#9d5433'
                }
              },
              {
                name: 'Almond',
                value: 1,
                itemStyle: {
                  color: '#c89f83'
                }
              }
            ]
          },
          {
            name: 'Cocoa',
            itemStyle: {
              color: '#bb764c'
            },
            children: [
              {
                name: 'Milk Chocolate',
                value: 1,
                itemStyle: {
                  color: '#B58E77'
                }
              },
              {
                name: 'Dark Chocolate',
                value: 1,
                itemStyle: {
                  color: '#470604'
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Sweet',
        itemStyle: {
          color: '#e65832'
        },
        children: [
          {
            name: 'Brown Sugar',
            itemStyle: {
              color: '#d45a59'
            },
            children: [
              {
                name: 'Molasses',
                value: 1,
                itemStyle: {
                  color: '#310d0f'
                }
              },
              {
                name: 'Maple Syrup',
                value: 1,
                itemStyle: {
                  color: '#ae341f'
                }
              },
              {
                name: 'Caramelized',
                value: 1,
                itemStyle: {
                  color: '#d78823'
                }
              },
              {
                name: 'Honey',
                value: 1,
                itemStyle: {
                  color: '#da5c1f'
                }
              }
            ]
          },
          {
            name: 'Vanilla',
            value: 1,
            itemStyle: {
              color: '#f89a80'
            }
          }
        ]
      }
    ];

    onMount(() => {
        chart = echarts.init(chartContainer);
        
        const option: EChartsOption = {
            series: [
                {
                    type: 'sunburst',
                    data: data,
                    radius: [0, '95%'],
                    emphasis: {
                        focus: 'relative'
                    },
                    nodeClick: false, // Disable zoom on click
                    label: {
                        rotate: 'radial'
                    },
                    levels: [
                        {},
                        {
                            radius: [0, '35%'],
                            label: {
                                align: 'right'
                            }
                        },
                        {
                            r0: '35%',
                            r: '70%',
                            label: {
                                align: 'right'
                            }
                        },
                        {
                            r0: '70%',
                            r: '72%',
                            label: {
                                position: 'outside',
                                padding: 3,
                                silent: false
                            }
                        }
                    ]
                }
            ]
        };

        chart.setOption(option as any);
        
        // Handle click events
        chart.on('click', (params: ECElementEvent) => {
            // Check if the clicked item has data and a name
            const data = params.data as { name?: string, value?: number };
            if (data && data.name) {
                // Only add tag if it has a name
                onFlavorSelect(data.name);
            }
        });

        // Handle window resize
        const handleResize = () => {
            chart.resize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.dispose();
        };
    });
</script>

<div class="w-full h-[500px]" bind:this={chartContainer}></div>

<style>
    :global(.echarts-tooltip) {
        background: var(--color-surface-500);
        border: 1px solid var(--color-surface-400);
        border-radius: 4px;
        padding: 8px;
        color: var(--color-surface-900);
    }
</style> 