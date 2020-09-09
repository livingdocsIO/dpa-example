const {getComponentName} = require('./utils')
const firstNodeId = Symbol('firstNodeId')

// TRANSMOGRIFIER
// --------------
//
//
//               o "o oo
//              oo$" ""$$ooo
//            o""       $$ "$o$oo
//   ooooo  o$          o$  $$"$$$
//  $    "   oo        o"   $$ $$$oo
//  $$$$$   "$             o"  ""$"""$
//   "$$$$              o  "o$oo   $$o$$
//      """              ""$oo ""$$o$$$$$$
//       "o              " ""$$oo "$$$$"
//         ""                 ""$$$o$
//         o                     o$"
//          $ooo                  o$$o
//            "                  "
//            o              o $
//          """    o o$"""   "
//             $oo   """""""$
//             ""    o$$o$$$$$
//            "$o   o$$ oo$$$o
//             $    o$$""$$o$$
//            $$    $$""""  $o     o$$o
//             "o  oo$     $$$     $$$$"
//        ooo$$$$oo$"$"$"$$$$$    $oo$"
//       o""   oo""$o$"$$$$o$"$o$oo$ "o"
//  oo"$$o" $"o      "    "oo$" $$"$o o o
//    """"$  o         $$$oo$ooo$""" ""
//       """o""o$""""
//
//
//
// Usage:
//
// const content = transmogrifier(serializedDoc)
//   .unwrap('article-container')
//   .rename('hero', 'supreme-leader')
//   .remove('footer')
//   .transform('paragraph', (component) => {
//     const title = component.content.title || ''
//     component.content.title = title.toUpperCase()
//     return component
//   })
//   .filter((component) => {
//     return !!component.content.title
//   })
//   .content()
//
module.exports = function transmogrifier (serializedDoc) {
  const {nodes} = buildLinkedTree(serializedDoc)

  const api = {
    wrap (container, iterator) {
      const state = {}
      for (const node of Object.values(nodes)) {
        // reset old first id
        if (node.previousId === firstNodeId) node.previousId = undefined
        // link to parent
        node.parentId = container.id
      }
      // add container as first
      nodes[container.id] = {component: container, id: container.id, containers: {}, previousId: firstNodeId}
      nodes[firstNodeId].nextId = container.id

      for (const node of Object.values(nodes)) {
        if (node.id === container.id) continue // not self
        iterator(nodes[container.id], node, state)
      }
      // console.log('after wrap', nodes)
      return api
    },
    transform (componentName, transformer) {
      for (const node of Object.values(nodes)) {
        if (isComponentMatch(node.component.identifier, componentName)) {
          node.component = transformer(node.component)
        }
      }
      return api
    },
    unwrap (componentName) {
      // todo: could be optimized by precomputing parsed componentNames (LP)
      // const removedIds = []
      for (const node of Object.values(nodes)) {
        if (isComponentMatch(node.component.identifier, componentName)) {
          // We can remove safely as Object.values() creats a new array
          // for the `for` loop.
          removeNodes(nodes, [node.id])

          const nextId = node.nextId

          // todo: could be undefined (LP)
          // -> case to unwrap a first child is not covered yet
          let previousId = node.previousId

          if (!node.containers) continue
          for (const containerName in node.containers) {
            const firstChildId = node.containers[containerName]
            if (!firstChildId) continue
            const firstChild = nodes[firstChildId]
            const lastNode = getLastNode(firstChild, nodes)
            linkNodes(nodes[previousId], firstChild)
            linkNodes(lastNode, nodes[nextId])
            previousId = lastNode.id
          }
        }
      }

      return api
    },

    remove (componentName) {
      const removedIds = []
      for (const node of Object.values(nodes)) {
        if (isComponentMatch(node.component.identifier, componentName)) {
          removedIds.push(node.id)
        }
      }
      removeNodes(nodes, removedIds)

      return api
    },

    removeId (id) {
      removeNodes(nodes, [id])
      return api
    },

    rename (componentName, newComponentName) {
      for (const node of Object.values(nodes)) {
        if (isComponentMatch(node.component.identifier, componentName)) {
          const prefix = node.component.identifier.slice(0, -componentName.length)
          node.component.identifier = `${prefix}${newComponentName}`
        }
      }
      return api
    },

    // rename to serialize()?
    content () {
      const firstId = nodes[firstNodeId].nextId
      return buildOutput(firstId, nodes)
    }
  }
  return api
}

function isComponentMatch (identifier, otherIdentifier) {
  const a = getComponentName(identifier)
  const b = getComponentName(otherIdentifier)
  return a && a === b
}

// todo: check for first node... (LP)
function removeNodes (nodes, ids) {
  for (const id of ids) {
    const node = nodes[id]
    const {previousId, nextId, parentId} = node

    if (previousId) {
      nodes[previousId].nextId = nextId
    } else if (parentId) {
      const parent = nodes[parentId]
      for (const containerName in parent.containers) {
        if (parent.containers[containerName] === id) {
          parent.containers[containerName] = nextId
        }
      }
    }

    if (nextId) {
      nodes[nextId].previousId = previousId
    }

    node.removed = true
    delete nodes[id]
  }
}

function linkNodes (previous, next) {
  if (!previous && !next) return
  if (!previous) {
    next.previousId = undefined
  } else if (!next) {
    previous.nextId = undefined
  } else {
    previous.nextId = next.id
    next.previousId = previous.id
  }
}

function getLastNode (node, nodes) {
  while (node && node.nextId) {
    node = nodes[node.nextId]
  }
  return node
}

// Serialized ComponentTree Iterators
// ----------------------------------

function* traverseWithContext (components, parent = {}) {
  let previous = {}

  for (const component of components) {
    yield {component, parent, previous}

    if (component.containers) {
      for (const containerName in component.containers) {
        const children = component.containers[containerName]
        yield * traverseWithContext(children, {id: component.id, containerName})
      }
    }

    previous = component
  }
}


// Linked Tree
// -----------

// builds an array of linked nodes:
// [{id, parentId, previousId, nextId, component}, ...]
function buildLinkedTree (serializedDoc) {
  const nodes = {[firstNodeId]: {}}

  if (!serializedDoc || !serializedDoc.length) return {nodes}

  for (const entry of traverseWithContext(serializedDoc)) {
    const {component, parent, previous} = entry
    const id = component.id
    const parentId = parent.id
    const previousId = previous.id

    nodes[id] = {id, parentId, previousId, component}

    if (previousId) {
      nodes[previousId].nextId = id
    } else if (parentId) {
      // link first child
      const parentEntry = nodes[parentId]
      parentEntry.containers = parentEntry.containers || {}
      parentEntry.containers[parent.containerName] = id
    } else {
      nodes[firstNodeId].nextId = id
      nodes[id].previousId = firstNodeId
    }
  }

  return {nodes}
}

// rebuild the serialized ComponentTree from a LinkedTree
function buildOutput (firstId, nodes, componentList = []) {
  let node = nodes[firstId]
  while (node) {
    const component = node.component

    // delete original containers
    delete component.containers

    componentList.push(component)
    for (const containerName in node.containers || {}) {
      // add containers again
      const childId = node.containers[containerName]
      component.containers = component.containers || {}
      component.containers[containerName] = buildOutput(childId, nodes)
    }
    node = nodes[node.nextId]
  }

  return componentList
}

// function* traverse (components) {
//   for (const component of components) {
//     yield component
//
//     if (component.containers) {
//       for (const key in component.containers) {
//         const children = component.containers[key]
//         yield * traverse(children)
//       }
//     }
//   }
// }

// function* traverseLinkedTree ({nodes}) {
//   let node = nodes[firstNodeId].nextId
//   while (node) {
//     yield node.component
//     for (const containerName in node.containers || {}) {
//       const childId = node.containers[containerName]
//       yield * traverseLinkedTree({first: childId, nodes})
//     }
//     node = node.nextId
//   }
// }
