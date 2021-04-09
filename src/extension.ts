// This is a test comment to ensure the extension works.
// Here we can see I have used a multiline comment.  
// Line breaks also work!
// 
// -	And here is a list

import * as vscode from 'vscode';


type Comment = {
	rowStart: number,
	rowEnd: number,
	charStart: number,
	charEnd: number,
	text: string,
	inline: boolean,
};


class CommentSplit {
	_getComments(text: string): Comment[] {
		throw new Error("getComments should be overwritten in subclass");
	}

	_removePrefix(comments: Comment[]): Comment[] {
		return comments;
	}

	getComments(text: string): Comment[] {
		return this._removePrefix(this._getComments(text));
	}

	getMergedComments(text: string): Comment[] {
		let comments: Comment[] = [];
		for (let comment of this._getComments(text)) {
			if (!comments.length) {
				comments.push(comment);
				continue;
			}
			let prev = comments[comments.length - 1];
			if (prev.rowEnd + 1 === comment.rowStart
				&& !prev.inline
				&& !comment.inline
			) {
				if (false) {
					comment.rowStart 	= prev.rowStart;
					let char = Math.min(prev.charStart, comment.charStart) - comment.charStart;
					comment.charStart 	= char + comment.charStart;
					comment.charEnd 	= char + comment.charEnd;
				}

				if (true) {
					comments.pop();
					comment.rowStart 	= prev.rowStart;
					comment.charStart 	= Math.min(prev.charStart, 	comment.charStart);
					comment.charEnd 	= Math.max(prev.charEnd, 	comment.charEnd);
					comment.text = prev.text + "\n" + comment.text;
				}
			}
			comments.push(comment);
		}
		return this._removePrefix(comments);
	}
}


class CComment extends CommentSplit {
	_getComments(text: string): Comment[] {
		return (
			text.split("\n")
				.map((line, row) => {
					let char = line.indexOf("//");
					let text = line.slice(char, undefined);
					return {
						rowStart: row,
						rowEnd: row,
						charStart: char,
						charEnd: text.length,
						text: text.replace(/^\/\/\s*/, ""),
						inline: !/^\s*$/.test(line.slice(0, char)),
					};
				})
				.filter(({charStart}) => charStart !== -1)
		);
	}
}


class PythonComment extends CommentSplit {
	_getComments(text: string): Comment[] {
		return (
			text.split("\n")
				.map((line, row) => {
					let char = line.indexOf("#");
					let text = line.slice(char, undefined);
					return {
						rowStart: row,
						rowEnd: row,
						charStart: char,
						charEnd: text.length,
						text: text.replace(/^\#/, ""),
						inline: !/^\s*$/.test(line.slice(0, char)),
					};
				})
				.filter(({charStart}) => charStart !== -1)
		);
	}
}


class HoverProvider implements vscode.HoverProvider {
	comments: CommentSplit;

	constructor(comments: CommentSplit) {
		this.comments = comments;
	}

	provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
		let comments = (
			this.comments.getMergedComments(document.getText())
				.filter(
					comment =>
						position.isAfterOrEqual(new vscode.Position(comment.rowStart, comment.charStart))
						&& position.isBeforeOrEqual(new vscode.Position(comment.rowEnd, comment.charEnd))
				)
		);
		if (comments.length) {
			let text = comments[0].text;
			console.log(text);
			let content = new vscode.MarkdownString();
			content.appendMarkdown(text);
			return new vscode.Hover(content);
		}
	}
}


export function activate(context: vscode.ExtensionContext) {
	vscode.languages.registerHoverProvider('typescript', new HoverProvider(new CComment()));
	vscode.languages.registerHoverProvider('python', new HoverProvider(new PythonComment()));
}

export function deactivate() {}
