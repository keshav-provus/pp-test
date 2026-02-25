import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Construction } from "lucide-react";
import Image from "next/image";

export default function Home() {
	return (
		<div className="relative flex min-h-screen items-center justify-center p-6 text-center">
			<div className="absolute inset-0 bg-gradient-to-b from-background to-muted/40" />
			<Card className="relative w-full max-w-4xl">
				<CardHeader className="items-center space-y-4">
					<div className="flex items-center gap-3">
						<Badge variant="secondary" className="gap-1.5">
							<Construction className="h-3.5 w-3.5" />
							Under Construction
						</Badge>
						<Badge variant="outline">Planning Poker</Badge>
					</div>
					<CardTitle className="text-3xl sm:text-4xl">
						Poker faces loading... 🎭
					</CardTitle>
					<CardDescription>
						Building something fun for sprint estimation. For now, enjoy this
						totally serious construction update.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<Image
						src="/planning-poker-under-development.svg"
						alt="Planning Poker under development"
						width={960}
						height={420}
						priority
						className="mx-auto w-full rounded-xl border"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
