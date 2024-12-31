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
import { getNodeImage } from "../../shared/utils/image-utils";
import { extractHostname } from "../../shared/utils/url-utils";
import { DomainsPanel } from "../../components/DomainsPanel";
import { getColor, stringToColor } from "../../shared/utils/color-utils";
import { animateNodes } from "sigma/utils";
import { PlainObject } from "sigma/types";
import { GiPerspectiveDiceSixFacesRandomExtended, LuCircleDashedExtended, PiGraphExtended } from "../../components/Icons/Icons";

const Root: FC = () => {
  const graph = useMemo(() => new DirectedGraph(), []);
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [data, setData] = useState<any | null>(null);
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

  // A variable is used to toggle state between start and stop
  let cancelCurrentAnimation: (() => void) | null = null;

  // correlate start/stop actions with state management
  function stopFA2() {
    fa2Layout?.stop();
    // FA2StartLabel.style.display = "flex";
    // FA2StopLabel.style.display = "none";
  }
  function startFA2() {
    if (cancelCurrentAnimation) cancelCurrentAnimation();
    fa2Layout?.start();
    // FA2StartLabel.style.display = "none";
    // FA2StopLabel.style.display = "flex";
  }

  // the main toggle function
  function toggleFA2Layout() {
    if (fa2Layout?.isRunning()) {
      stopFA2();
    } else {
      startFA2();
    }
  }
    /** CIRCULAR LAYOUT **/
    /* This example shows how to use an existing deterministic graphology layout */
    function circularLayout() {
      // stop fa2 if running
      if (fa2Layout?.isRunning()) stopFA2();
      if (cancelCurrentAnimation) cancelCurrentAnimation();

      //since we want to use animations we need to process positions before applying them through animateNodes
      const circularPositions = circular(graph, { scale: 100 });
      //In other context, it's possible to apply the position directly we : circular.assign(graph, {scale:100})
      cancelCurrentAnimation = animateNodes(graph, circularPositions, { duration: 2000, easing: "linear" });
    }

  // Random layout
      /** RANDOM LAYOUT **/
    /* Layout can be handled manually by setting nodes x and y attributes */
    /* This random layout has been coded to show how to manipulate positions directly in the graph instance */
    /* Alternatively a random layout algo exists in graphology: https://github.com/graphology/graphology-layout#random  */
    function randomLayout() {
      // stop fa2 if running
      if (fa2Layout?.isRunning()) stopFA2();
      if (cancelCurrentAnimation) cancelCurrentAnimation();

      // to keep positions scale uniform between layouts, we first calculate positions extents
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
        // create random positions respecting position extents
        randomPositions[node] = {
          x: Math.random() * (xExtents.max - xExtents.min),
          y: Math.random() * (yExtents.max - yExtents.min),
        };
      });
      // use sigma animation to update new positions
      cancelCurrentAnimation = animateNodes(graph, randomPositions, { duration: 2000 });
    }

  // Load data on mount:
  // useEffect(() => {
  //   fetch(`./sample.json`)
  //     .then((res) => res.json())
  //     .then((dataset: Dataset) => {
  //       const clusters = keyBy(dataset.clusters, "key");
  //       const tags = keyBy(dataset.tags, "key");

  //       dataset.nodes.forEach((node) =>
  //         graph.addNode(node.key, {
  //           ...node,
  //           ...omit(clusters[node.cluster], "key"),
  //           image: `./images/${tags[node.tag].image}`,
  //         }),
  //       );
  //       dataset.edges.forEach(([source, target]) => graph.addEdge(source, target, { size: 1 }));

  //       // Use degrees as node sizes:
  //       const scores = graph.nodes().map((node) => graph.getNodeAttribute(node, "score"));
  //       const minDegree = Math.min(...scores);
  //       const maxDegree = Math.max(...scores);
  //       const MIN_NODE_SIZE = 3;
  //       const MAX_NODE_SIZE = 30;
  //       graph.forEachNode((node) =>
  //         graph.setNodeAttribute(
  //           node,
  //           "size",
  //           ((graph.getNodeAttribute(node, "score") - minDegree) / (maxDegree - minDegree)) *
  //           (MAX_NODE_SIZE - MIN_NODE_SIZE) +
  //           MIN_NODE_SIZE,
  //         ),
  //       );

  //       setFiltersState({
  //         clusters: mapValues(keyBy(dataset.clusters, "key"), constant(true)),
  //         tags: mapValues(keyBy(dataset.tags, "key"), constant(true)),
  //       });
  //       setDataset(dataset);
  //       requestAnimationFrame(() => setDataReady(true));
  //     });
  // }, []);


  useEffect(() => {
    if (data === null) return;

    const types = keyBy([...new Set([...data.map((elm: CrawlerEntry) => elm.type)])])
    const domains = keyBy([...new Set([...data.map((elm: CrawlerEntry) => extractHostname(elm.source))])])

    // Add nodes
    data.forEach((item: CrawlerEntry) => {
      try {
        // Default node key is it's id.
        graph.addNode(item.id, {
          // Assign random coordinates to nodes, as it will be reordered in later stages.
          x: Math.random(),
          y: Math.random(),
          // Default size that will be overwritten later.
          size: 3,
          label: item.title,
          color: getColor(item.type ?? 'page'),
          source: item.source,
          image: getNodeImage(item),
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

    // Add edges
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

    // Use edges as node sizes:
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
  }, [data])

  const onError = (error: string) => {
    setErrors(errors => [...errors, error])
    setData(null)
  }

  const onFileUpload = (data: any) => {
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
          {/* <div className="flex flex-col justify-center content-center place-content-center h-full">
            <div className="max-w-2xl mx-auto">

              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-black-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="mb-2 text-sm text-black-500 dark:text-black-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-black-500 dark:text-black-400">JSON file</p>
                  </div>
                  <input id="dropzone-file" type="file" className="hidden" />
                </label>
              </div>

              <p className="mt-5">This file input component is part of a larger, open-source library of Tailwind CSS components. Learn
                more
                by going to the official <a className="text-blue-600 hover:underline"
                  href="#" target="_blank">Flowbite Documentation</a>.
              </p>
              <script src="https://unpkg.com/flowbite@1.4.0/dist/flowbite.js"></script>
            </div>          </div> */}
          <FileUpload onFileUpload={onFileUpload} onError={onError} />
          {errors && errors.map(error => <ErrorBox message={error} title="Error while importing data" key={error} />)}
        </div>
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
                <span><LuCircleDashedExtended className="w-5 h-5 mr-1"/>circular</span>
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
                {/* <ClustersPanel
                  clusters={dataset.clusters}
                  filters={filtersState}
                  setClusters={(clusters) =>
                    setFiltersState((filters) => ({
                      ...filters,
                      clusters,
                    }))
                  }
                  toggleCluster={(cluster) => {
                    setFiltersState((filters) => ({
                      ...filters,
                      clusters: filters.clusters[cluster]
                        ? omit(filters.clusters, cluster)
                        : { ...filters.clusters, [cluster]: true },
                    }));
                  }}
                />
                <TagsPanel
                  tags={dataset.tags}
                  filters={filtersState}
                  setTags={(tags) =>
                    setFiltersState((filters) => ({
                      ...filters,
                      tags,
                    }))
                  }
                  toggleTag={(tag) => {
                    setFiltersState((filters) => ({
                      ...filters,
                      tags: filters.tags[tag] ? omit(filters.tags, tag) : { ...filters.tags, [tag]: true },
                    }));
                  }}
                /> */}
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