import {
	type Completion,
	type CompletionContext,
	acceptCompletion,
	closeCompletion,
} from '@codemirror/autocomplete';
import type { ViewUpdate } from '@codemirror/view';
import type { SyntaxNodeRef, Tree, TreeCursor } from '@lezer/common';

import { parser } from '../grammar/zenuml-parser';

// Function to extract participant names from the syntax tree
// Store participant names globally for autocompletion
const participantNames = new Set<string>();

function extractParticipantNames(content: string, tree: Tree): void {
	participantNames.clear();

	tree.cursor().iterate((node: SyntaxNodeRef) => {
		if (node.type.name === 'Participant') {
			const c = node as unknown as TreeCursor;
			c.firstChild();
			while (c.nextSibling()) {
				if (c.type.name === 'Name' || c.type.name === 'Identifier') {
					const name = content.slice(c.from, c.to).trim();
					if (name) {
						participantNames.add(name);
					}
				}
			}
		}
	});
}

function zenumlCompletionListener(update: ViewUpdate): void {
	if (update.docChanged) {
		const content = update.state.doc.toString();
		const tree = parser.parse(content);
		console.log(tree.toString());
		extractParticipantNames(content, tree);
	}
}
// Get default completions
const defaultOptions: Completion[] = [
	// Keywords
	{ label: 'title', type: 'keyword' },
	{ label: 'participant', type: 'keyword' },
	{ label: 'group', type: 'keyword' },
	{ label: 'if', type: 'keyword' },
	{ label: 'else', type: 'keyword' },
	{ label: 'while', type: 'keyword' },
	{ label: 'par', type: 'keyword' },
	{ label: 'opt', type: 'keyword' },
	{ label: 'critical', type: 'keyword' },
	{ label: 'section', type: 'keyword' },
	{ label: 'try', type: 'keyword' },
	{ label: 'catch', type: 'keyword' },
	{ label: 'finally', type: 'keyword' },
	{ label: 'async', type: 'keyword' },
	{ label: 'Starter', type: 'type' },
	// Common stereotypes
	{ label: '<<interface>>', type: 'type' },
	{ label: '<<boundary>>', type: 'type' },
	{ label: '<<control>>', type: 'type' },
	{ label: '<<entity>>', type: 'type' },
	// Common participant types
	{ label: '@Boundary', type: 'type' },
	{ label: '@Control', type: 'type' },
	{ label: '@Actor', type: 'type' },
	{ label: '@User', type: 'type' },
	{ label: '@System', type: 'type' },
	{ label: '@Database', type: 'type' },
	{ label: '@Service', type: 'type' },
	// Cloud services
	{ label: '@CloudWatch', type: 'type' },
	{ label: '@CloudFront', type: 'type' },
	{ label: '@Cognito', type: 'type' },
	{ label: '@DynamoDB', type: 'type' },
	{ label: '@EBS', type: 'type' },
	{ label: '@EC2', type: 'type' },
	{ label: '@ECS', type: 'type' },
	{ label: '@EFS', type: 'type' },
	{ label: '@ElastiCache', type: 'type' },
	{ label: '@ElasticBeantalk', type: 'type' },
	{ label: '@ElasticFileSystem', type: 'type' },
	{ label: '@Glacier', type: 'type' },
	{ label: '@IAM', type: 'type' },
	{ label: '@Kinesis', type: 'type' },
	{ label: '@Lambda', type: 'type' },
	{ label: '@LightSail', type: 'type' },
	{ label: '@RDS', type: 'type' },
	{ label: '@Redshift', type: 'type' },
	{ label: '@S3', type: 'type' },
	{ label: '@SNS', type: 'type' },
	{ label: '@SQS', type: 'type' },
	{ label: '@Sagemaker', type: 'type' },
	{ label: '@VPC', type: 'type' },
	{ label: '@AzureActiveDirectory', type: 'type' },
	{ label: '@AzureBackup', type: 'type' },
	{ label: '@AzureCDN', type: 'type' },
	{ label: '@AzureDataFactory', type: 'type' },
	{ label: '@AzureDevOps', type: 'type' },
	{ label: '@AzureFunction', type: 'type' },
	{ label: '@AzureSQL', type: 'type' },
	{ label: '@CosmosDB', type: 'type' },
	{ label: '@LogicApps', type: 'type' },
	{ label: '@VirtualMachine', type: 'type' },
	{ label: '@BigTable', type: 'type' },
	{ label: '@BigQuery', type: 'type' },
	{ label: '@CloudCDN', type: 'type' },
	{ label: '@CloudDNS', type: 'type' },
	{ label: '@CloudInterconnect', type: 'type' },
	{ label: '@CloudLoadBalancing', type: 'type' },
	{ label: '@CloudSQL', type: 'type' },
	{ label: '@CloudStorage', type: 'type' },
	{ label: '@DataLab', type: 'type' },
	{ label: '@DataProc', type: 'type' },
	{ label: '@GoogleIAM', type: 'type' },
	{ label: '@GoogleSecurity', type: 'type' },
	{ label: '@GoogleVPC', type: 'type' },
	{ label: '@PubSub', type: 'type' },
	{ label: '@SecurityScanner', type: 'type' },
	{ label: '@StackDriver', type: 'type' },
	{ label: '@VisionAPI', type: 'type' },
];

function zenumlCompletions(context: CompletionContext) {
	const word = context.matchBefore(/[@<]{0,2}\w*/);
	if (!word || (word.from === word.to && !context.explicit)) return null;

	const participantOptions: Completion[] = Array.from(participantNames).map((name) => ({
		label: name,
		type: 'variable',
		boost: 1.5,
	}));

	// Combine both sets of completions
	return {
		from: word.from,
		options: [...defaultOptions, ...participantOptions],
	};
}

const zenumlCompletionKeyMaps = [
	{ key: 'Tab', run: acceptCompletion },
	{ key: 'Enter', run: acceptCompletion },
	{ key: 'Escape', run: closeCompletion },
];

export { zenumlCompletionKeyMaps, zenumlCompletions, zenumlCompletionListener };
