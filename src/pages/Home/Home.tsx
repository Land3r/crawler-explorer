import { FullScreenControl, SigmaContainer, ZoomControl } from "@react-sigma/core";
import { createNodeImageProgram } from "@sigma/node-image";
import { DirectedGraph } from "graphology";
import { constant, keyBy, mapValues, omit } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { BiBookContent, BiRadioCircleMarked } from "react-icons/bi";
import { BsArrowsFullscreen, BsFullscreenExit, BsZoomIn, BsZoomOut } from "react-icons/bs";
import { GrClose } from "react-icons/gr";
import { Settings } from "sigma/settings";
import { inferSettings } from 'graphology-layout-forceatlas2'
import FA2Layout from 'graphology-layout-forceatlas2/worker'
import { circular } from 'graphology-layout'

import { drawHover, drawLabel } from "../../shared/utils/canvas-utils";
import { CrawlerEntry, Dataset, FiltersState } from "../../types";
import { GraphDataController } from "../../components/GraphDataController";
import { GraphEventsController } from "../../components/GraphEventsController";
import { GraphSettingsController } from "../../components/GraphSettingsController";
import { GraphTitle } from "../../components/GraphTitle";
import { SearchFields } from "../../components/SearchFields";
import { NodeDetailPanel } from "../../components/NodeDetailPanel";
import { FileUpload } from "../../components/FileUpload";
import { ErrorBox } from "../../components/ErrorBox";
import { TypesPanel } from "../../components/TypesPanel";
import { extractHostname } from "../../shared/utils/url-utils";
import { DomainsPanel } from "../../components/DomainsPanel";
import { getColor, stringToColor } from "../../shared/utils/color-utils";
import { animateNodes } from "sigma/utils";
import { PlainObject } from "sigma/types";
import { GiPerspectiveDiceSixFacesRandomExtended, IoMdCloseExtended, LuCircleDashedExtended, PiGraphExtended } from "../../components/Icons/Icons";
import { GitHubLink } from "../../components/GitHubLink";

const Root: FC = () => {
  const graph = useMemo(() => new DirectedGraph(), []);
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [data, setData] = useState<unknown | null>(null);
  const [filtersState, setFiltersState] = useState<FiltersState>({
    types: {},
    domains: {}
  });
  const [fa2Layout, setfa2layout] = useState<FA2Layout | null>(null)

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const [errors, setErrors] = useState<string[]>([]);

  const sigmaSettings: Partial<Settings> = useMemo(
    () => ({
      nodeProgramClasses: {
        image: createNodeImageProgram({
          padding: 0.3,
          size: { mode: "force", value: 256 },
        }),
      },
      defaultDrawNodeLabel: drawLabel,
      defaultDrawNodeHover: drawHover,
      defaultNodeType: "image",
      defaultEdgeType: "arrow",
      labelDensity: 0.07,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: 15,
      labelFont: "Lato, sans-serif",
      zIndex: true,
    }),
    [],
  );

  // Allows to cancel random layout animation on another layout trigger.
  let cancelCurrentAnimation: (() => void) | null = null;

  // 2FA Layout
  function stopFA2() {
    fa2Layout?.stop();
  }
  function startFA2() {
    if (cancelCurrentAnimation) {
      cancelCurrentAnimation();
    }
    fa2Layout?.start();
  }
  function toggleFA2Layout() {
    if (fa2Layout?.isRunning()) {
      stopFA2();
    } else {
      startFA2();
    }
  }
    
  // Circular Layout
  function circularLayout() {
    if (fa2Layout?.isRunning()) {
      stopFA2();
    }
    if (cancelCurrentAnimation) {
      cancelCurrentAnimation();
    }

    const circularPositions = circular(graph, { scale: 100 });
    cancelCurrentAnimation = animateNodes(graph, circularPositions, { duration: 2000, easing: "linear" });
  }

  // Random layout
  function randomLayout() {
    if (fa2Layout?.isRunning()) {
      stopFA2();
    }
    if (cancelCurrentAnimation) {
      cancelCurrentAnimation();
    }

    const xExtents = { min: 0, max: 0 };
    const yExtents = { min: 0, max: 0 };
    graph.forEachNode((_node, attributes) => {
      xExtents.min = Math.min(attributes.x, xExtents.min);
      xExtents.max = Math.max(attributes.x, xExtents.max);
      yExtents.min = Math.min(attributes.y, yExtents.min);
      yExtents.max = Math.max(attributes.y, yExtents.max);
    });
    const randomPositions: PlainObject<PlainObject<number>> = {};
    graph.forEachNode((node) => {
      randomPositions[node] = {
        x: Math.random() * (xExtents.max - xExtents.min),
        y: Math.random() * (yExtents.max - yExtents.min),
      };
    });
    cancelCurrentAnimation = animateNodes(graph, randomPositions, { duration: 2000 });
  }

  function resetGraph() {
    window.location.reload();
  }

  useEffect(() => {
    if (data === null) return;

    const types = keyBy([...new Set([...data.map((elm: CrawlerEntry) => elm.type)])])
    const domains = keyBy([...new Set([...data.map((elm: CrawlerEntry) => extractHostname(elm.source))])])

    // Nodes
    data.forEach((item: CrawlerEntry) => {
      try {
        // Default node key is it's id.
        graph.addNode(item.id, {
          x: Math.random(),
          y: Math.random(),
          // Default size that will be overwritten later.
          size: 3,
          label: item.title,
          color: getColor(item.type ?? 'page'),
          source: item.source,
          data: { ...item }
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.message.includes('Graph.addEdge')) {
            setErrors((errors) => ([
              ...errors,
              error.toString()
            ]))
            return;
          } else {
            console.log('Error while drawing edges :', error)
          }
        } else {
          console.log('Error while drawing edges :', error)
        }
      }
    });

    // Edges
    data.forEach((item: CrawlerEntry) => {
      try {

        if (item.id && item.id !== undefined && item.id !== null && item.parent && item.parent?.id !== null && item.parent?.id !== undefined) {
          graph.addEdge(item.parent.id, item.id, { width: 1 });
        } else {
          console.log(`Error on edge from ${item.parent.id} to ${item.id}`)
        }

      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.message.includes('Graph.addEdge')) {
            setErrors((errors) => ([
              ...errors,
              error.toString()
            ]))
            return;
          } else {
            console.log('Error while drawing edges :', error)
          }
        } else {
          console.log('Error while drawing edges :', error)
        }
      }
    });

    // Use edge count from & to nodes to change it's size
    const scores = graph.nodes().map((node) => graph.edges(node).length);
    const minDegree = Math.min(...scores);
    const maxDegree = Math.max(...scores);
    const MIN_NODE_SIZE = 3;
    const MAX_NODE_SIZE = 30;
    graph.forEachNode((node) =>
      graph.setNodeAttribute(
        node,
        "size",
        ((graph.edges(node).length - minDegree) / (maxDegree - minDegree)) *
        (MAX_NODE_SIZE - MIN_NODE_SIZE) +
        MIN_NODE_SIZE,
      ),
    );

    // ForceAtlas2 layout background worker
    const sensibleSettings = inferSettings(graph);
    setfa2layout(new FA2Layout(graph, {
      settings: sensibleSettings,
    }));

    setFiltersState({
      types: mapValues(types, constant(true)),
      domains: mapValues(domains, constant(true)),
    });
    setDataset({
      data,
      types: [
        ...Object.keys(types).map(type => ({
          typeLabel: type,
          color: getColor(type),
          key: type,
        }))
      ],
      domains: [
        ...Object.keys(domains).map(domain => ({
          domainLabel: domain,
          color: stringToColor(domain),
          key: domain,
        }))
      ],
    });
    requestAnimationFrame(() => setDataReady(true));
  }, [data, graph])

  const onError = (error: string) => {
    setErrors(errors => [...errors, error])
    setData(null)
  }

  const onFileUpload = (data: unknown) => {
    setErrors([])
    setData(data)
  }

  if (!dataset) return (
    <>
      <div id="app-root" className="show-contents">
        <div className="flex flex-col">
          <div className="graph-title">
            <h1>A cartography of crawler result</h1>
          </div>
          <FileUpload onFileUpload={onFileUpload} onError={onError} />
          {errors && errors.map(error => <ErrorBox message={error} title="Error while importing data" key={error} />)}
        </div>
        <GitHubLink repoUrl='https://github.com/Land3r/crawler-explorer' />
      </div>
    </>
  );

  return (
    <div id="app-root" className={showContents ? "show-contents" : ""}>
      <SigmaContainer graph={graph} settings={sigmaSettings} className="react-sigma">
        <GraphSettingsController hoveredNode={hoveredNode} />
        <GraphEventsController setHoveredNode={setHoveredNode} setSelectedNode={setSelectedNode} />
        <GraphDataController filters={filtersState} />

        {dataReady && (
          <>
            <div className="buttons text-primary">
              <button id="random" type="button" className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-full text-sm px-3 py-1 mr-1 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" onClick={randomLayout}>
                <span>
                  <GiPerspectiveDiceSixFacesRandomExtended className="w-5 h-5 mr-1" />
                  Random
                </span>
              </button>
              <button id="forceatlas2" type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-3 py-1 text-center mr-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={toggleFA2Layout}>
                <span>
                  <PiGraphExtended className="w-5 h-5 mr-1" />
                  Force Atlas 2
                </span>
              </button>
              <button id="circular" type="button" className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-3 py-1 text-center mr-1 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800" onClick={circularLayout}>
                <span>
                  <LuCircleDashedExtended className="w-5 h-5 mr-1" />
                  Circular
                </span>
              </button>
              <button id="reset" type="button" className="text-white bg-red-500 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-3 py-1 text-center mr-1 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800" onClick={resetGraph}>
                <span>
                  <IoMdCloseExtended className="w-5 h-5 mr-1" />
                  Reset
                </span>
              </button>
            </div>
            <div className="controls">
              <div className="react-sigma-control ico">
                <button
                  type="button"
                  className="show-contents"
                  onClick={() => setShowContents(true)}
                  title="Show caption and description"
                >
                  <BiBookContent />
                </button>
              </div>
              <FullScreenControl className="ico">
                <BsArrowsFullscreen />
                <BsFullscreenExit />
              </FullScreenControl>

              <ZoomControl className="ico">
                <BsZoomIn />
                <BsZoomOut />
                <BiRadioCircleMarked />
              </ZoomControl>
            </div>
            <div className="contents">
              <div className="ico">
                <button
                  type="button"
                  className="ico hide-contents"
                  onClick={() => setShowContents(false)}
                  title="Show caption and description"
                >
                  <GrClose />
                </button>
              </div>
              <GraphTitle filters={filtersState} />
              <div className="panels">
                <SearchFields filters={filtersState} />
                {/* <DescriptionPanel /> */}
                <TypesPanel types={dataset.types} filters={filtersState} setTypes={(types) =>
                  setFiltersState((filters) => ({
                    ...filters,
                    types,
                  }))
                }
                  toggleType={(type) => {
                    setFiltersState((filters) => ({
                      ...filters,
                      types: filters.types[type]
                        ? omit(filters.types, type)
                        : { ...filters.types, [type]: true },
                    }));
                  }}
                />
                <DomainsPanel domains={dataset.domains} filters={filtersState} setDomains={(domains) =>
                  setFiltersState((filters) => ({
                    ...filters,
                    domains,
                  }))
                }
                  toggleDomain={(domain) => {
                    setFiltersState((filters) => ({
                      ...filters,
                      domains: filters.domains[domain]
                        ? omit(filters.domains, domain)
                        : { ...filters.domains, [domain]: true },
                    }));
                  }}
                />
                <NodeDetailPanel node={selectedNode} />
              </div>
            </div>
          </>
        )}
      </SigmaContainer>
    </div>
  );
};

export default Root;