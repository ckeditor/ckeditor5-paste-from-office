/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module paste-from-office/filters/generic
 */

import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';

// TODO docs
export function stripGDocsWrapper( body ) {
	const firstChild = body.getChild( 0 );

	if ( firstChild && firstChild.name === 'b' && firstChild.hasAttribute( 'id' ) &&
		firstChild.getAttribute( 'id' ).includes( 'docs-internal-guid' ) ) {
		const writer = new UpcastWriter();

		return writer.createDocumentFragment( Array.from( firstChild.getChildren() ) );
	}

	return body;
}

// TODO docs
export function inlineListItemsContent( body ) {
	const writer = new UpcastWriter();
	const range = writer.createRangeIn( body );

	for ( const value of range ) {
		if ( value.type === 'elementStart' && value.item.name === 'li' ) {
			inlineLiContent( value.item, writer );
		}
	}

	return body;
}

// TODO docs
export function replaceBrsWithEmptyP( body ) {
	const writer = new UpcastWriter();
	const range = writer.createRangeIn( body );

	const elementsToReplace = [];
	for ( const value of range ) {
		if ( value.type === 'elementStart' && value.item.name === 'br' && value.item.parent.is( 'documentFragment' ) ) {
			elementsToReplace.push( value.item );
		}
	}

	for ( const br of elementsToReplace ) {
		writer.replace( br, writer.createElement( 'p' ) );
	}

	return body;
}

// TODO docs
// <p role="heading" aria-level="1"
export function paragraphsToHeadings( body ) {
	const writer = new UpcastWriter();
	const range = writer.createRangeIn( body );

	const elementsToReplace = [];
	for ( const value of range ) {
		const el = value.item;
		if ( value.type === 'elementStart' && el.name === 'p' &&
			el.getAttribute( 'role' ) === 'heading' && el.hasAttribute( 'aria-level' ) ) {
			elementsToReplace.push( el );
		}
	}

	for ( const el of elementsToReplace ) {
		const heading = writer.createElement( `h${ el.getAttribute( 'aria-level' ) }` );

		writer.appendChild( el.getChildren(), heading );
		writer.replace( el, heading );
	}

	return body;
}

// TODO docs
function inlineLiContent( li, writer ) {
	const range = writer.createRangeIn( li );
	const contentWrapper = writer.createElement( 'span' );
	const disallowTags = [ 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'img' ];

	const allChildren = [];
	for ( const value of range ) {
		const el = value.item;
		if ( value.type === 'elementStart' && disallowTags.indexOf( el.name ) === -1 ) {
			allChildren.push( value.item );
		}
	}

	const childrenToMove = allChildren.filter( ( el, i, arr ) => {
		return !arr.includes( el.parent );
	} );

	writer.removeChildren( 0, li.childCount, li );
	writer.appendChild( childrenToMove, contentWrapper );
	writer.appendChild( contentWrapper, li );
}

// Word online
// - cannot recognize headers vs text in table cell - https://www.diffchecker.com/mMs6roxf
// - empty list items are not preserved

// Google Docs
// - sometimes BRs inside list items are outside in clipboard data
